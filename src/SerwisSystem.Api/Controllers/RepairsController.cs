using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SerwisSystem.Api.Authorization;
using SerwisSystem.Api.Data;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Models.Enums;
using SerwisSystem.Api.Services;

namespace SerwisSystem.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RepairsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PermissionService _permissionService;
    private readonly UserService _userService;
    private readonly EmailService _emailService;
    private readonly ILogger<RepairsController> _logger;

    // Status corrections an admin can make with PUT {id}/status.
    // Everyday work uses take / complete / cancel / return instead.
    private static readonly Dictionary<RepairStatus, RepairStatus[]> AllowedStatusChanges = new()
    {
        [RepairStatus.Pending] = [RepairStatus.Cancelled],
        [RepairStatus.InProgress] = [RepairStatus.Pending, RepairStatus.Cancelled],
        [RepairStatus.Completed] = [RepairStatus.InProgress],   // reopen, worker is kept
        [RepairStatus.Cancelled] = [RepairStatus.Pending],
    };

    public RepairsController(
        AppDbContext context,
        PermissionService permissionService,
        UserService userService,
        EmailService emailService,
        ILogger<RepairsController> logger)
    {
        _context = context;
        _permissionService = permissionService;
        _userService = userService;
        _emailService = emailService;
        _logger = logger;
    }


    // GET api/repairs
    [RequirePermission(Permission.ReadRepairs)]
    [HttpGet]
    public async Task<IActionResult> GetRepairs(
        string? search,
        [FromQuery] List<RepairStatus>? statuses,
        bool mine = false,
        string sortBy = "createdAt",
        bool descending = true,
        int page = 1,
        int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Repairs
            .Include(r => r.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();

            query = query.Where(r =>
                r.SerialNumber.ToLower().Contains(search) ||
                r.Product.ToLower().Contains(search) ||

                r.ReporterName.ToLower().Contains(search) ||
                r.ReporterSurname.ToLower().Contains(search) ||
                r.ReporterPhone.ToLower().Contains(search) ||
                r.ReporterEmail.ToLower().Contains(search) ||

                r.CompanyName.ToLower().Contains(search) ||
                r.CompanyAddress.ToLower().Contains(search) ||
                r.CompanyPostalCode.ToLower().Contains(search) ||
                r.CompanyCity.ToLower().Contains(search) ||
                r.CompanyNip.ToLower().Contains(search) ||

                (r.PurchaseInvoiceNumber != null &&
                 r.PurchaseInvoiceNumber.ToLower().Contains(search)) ||

                (r.ContractNumber != null &&
                 r.ContractNumber.ToLower().Contains(search)) ||

                (r.User != null &&
                 r.User.Username.ToLower().Contains(search))
            );
        }

        if (statuses != null && statuses.Count > 0)
        {
            query = query.Where(r => statuses.Contains(r.Status));
        }

        // Only the repairs assigned to the logged-in user
        if (mine)
        {
            var currentUser = await _userService.GetCurrentUser(User);

            if (currentUser == null)
                return CurrentUserNotFound();

            query = query.Where(r => r.UserId == currentUser.Id);
        }

        // An unknown key is an error in the client, so it gets a 400
        // instead of a silent fallback to the default order.
        IQueryable<Repair>? sortedQuery = sortBy.ToLowerInvariant() switch
        {
            "id" => descending
                ? query.OrderByDescending(r => r.Id)
                : query.OrderBy(r => r.Id),

            "serialnumber" => descending
                ? query.OrderByDescending(r => r.SerialNumber)
                : query.OrderBy(r => r.SerialNumber),

            "product" => descending
                ? query.OrderByDescending(r => r.Product)
                : query.OrderBy(r => r.Product),

            "reportersurname" => descending
                ? query.OrderByDescending(r => r.ReporterSurname)
                    .ThenByDescending(r => r.ReporterName)
                : query.OrderBy(r => r.ReporterSurname)
                    .ThenBy(r => r.ReporterName),

            "status" => descending
                ? query.OrderByDescending(r => r.Status)
                    .ThenByDescending(r => r.CreatedAt)
                : query.OrderBy(r => r.Status)
                    .ThenBy(r => r.CreatedAt),

            "address" => descending
                ? query.OrderByDescending(r => r.CompanyAddress)
                : query.OrderBy(r => r.CompanyAddress),

            "createdat" => descending
                ? query.OrderByDescending(r => r.CreatedAt)
                : query.OrderBy(r => r.CreatedAt),

            _ => null
        };

        if (sortedQuery == null)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"Unknown sortBy value '{sortBy}'. Use one of: " +
                        "id, serialNumber, product, reporterSurname, status, address, createdAt.");
        }

        query = sortedQuery;

        var totalCount = await query.CountAsync();

        var repairs = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            Items = repairs.Select(RepairResponseDto.FromEntity),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }


    // GET api/repairs/{id}
    [RequirePermission(Permission.ReadRepairs)]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRepair(int id)
    {
        var repair = await FindRepairWithWorker(id);

        if (repair == null)
            return RepairNotFound();

        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs
    // Public endpoint used by the customer app. Rate limited,
    // because every call sends an email to the given address.
    [AllowAnonymous]
    [EnableRateLimiting("public")]
    [HttpPost]
    public async Task<IActionResult> CreateRepair(CreateRepairDto dto)
    {
        ValidateRepairData(dto);

        if (!dto.ServiceDataConsent)
        {
            ModelState.AddModelError(
                "serviceDataConsent",
                "Consent to process personal data for service purposes is required.");
        }

        if (!ModelState.IsValid)
            return InvalidRepairData();

        var repair = new Repair
        {
            ServiceDataConsent = dto.ServiceDataConsent,
            MarketingConsent = dto.MarketingConsent
        };

        CopyRepairData(dto, repair);

        _context.Repairs.Add(repair);
        await _context.SaveChangesAsync();

        // The repair is already saved, so a mail server problem
        // must not turn a successful request into an error.
        try
        {
            await _emailService.SendRepairCreatedEmail(
                repair.ReporterEmail,
                $"{repair.ReporterName} {repair.ReporterSurname}",
                repair.Id,
                repair.Product,
                repair.SerialNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send the confirmation email for repair {RepairId}.",
                repair.Id);
        }

        // The caller is anonymous, so it gets only the public view of the repair.
        return CreatedAtAction(
            nameof(GetRepair),
            new { id = repair.Id },
            PublicRepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs/check
    // Public repair status check used by the customer app.
    // Rate limited to slow down guessing id and email pairs.
    [AllowAnonymous]
    [EnableRateLimiting("public")]
    [HttpPost("check")]
    public async Task<IActionResult> CheckRepair(CheckRepairDto dto)
    {
        var email = NormalizeEmail(dto.Email);

        // ToLower() on the column also matches repairs
        // saved before emails were normalised.
        var repair = await _context.Repairs
            .FirstOrDefaultAsync(r =>
                r.Id == dto.Id &&
                r.ReporterEmail.ToLower() == email);

        if (repair == null)
            return RepairNotFound();

        return Ok(PublicRepairResponseDto.FromEntity(repair));
    }


    // PUT api/repairs/{id}
    [RequirePermission(Permission.EditRepairs)]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> EditRepair(int id, UpdateRepairDto updatedRepair)
    {
        var repair = await FindRepairWithWorker(id);

        if (repair == null)
            return RepairNotFound();

        ValidateRepairData(updatedRepair);

        if (!ModelState.IsValid)
            return InvalidRepairData();

        CopyRepairData(updatedRepair, repair);

        await _context.SaveChangesAsync();

        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // PUT api/repairs/{id}/status
    // Lets an admin correct a mistake, e.g. reopen a repair
    // that was completed by accident.
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> ChangeRepairStatus(int id, UpdateRepairStatusDto dto)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserNotFound();

        // The role is read from the database, not from the token,
        // so a demoted admin loses this right immediately.
        if (user.Role != UserRole.Admin)
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                detail: "Only an admin can change the repair status.");
        }

        var repair = await FindRepairWithWorker(id);

        if (repair == null)
            return RepairNotFound();

        // Never null here: [Required] is checked before the action runs.
        var newStatus = dto.Status!.Value;

        if (!AllowedStatusChanges[repair.Status].Contains(newStatus))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: $"Status change from {repair.Status} to {newStatus} is not allowed.");
        }

        // A pending repair waits in the queue without a worker,
        // so that anyone can take it again.
        if (newStatus == RepairStatus.Pending)
        {
            repair.User = null;
            repair.UserId = null;
        }

        repair.Status = newStatus;

        await _context.SaveChangesAsync();

        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // DELETE api/repairs/{id}
    [RequirePermission(Permission.DeleteRepairs)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRepair(int id)
    {
        var repair = await _context.Repairs.FindAsync(id);

        if (repair == null)
            return RepairNotFound();

        _context.Repairs.Remove(repair);
        await _context.SaveChangesAsync();

        return NoContent();
    }


    // POST api/repairs/{id}/take
    [RequirePermission(Permission.TakeRepairs)]
    [HttpPost("{id:int}/take")]
    public async Task<IActionResult> TakeRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserNotFound();

        var repair = await FindRepairWithWorker(id);

        if (repair == null)
            return RepairNotFound();

        if (repair.UserId != null)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: "Repair is already assigned to a worker.");
        }

        if (repair.Status != RepairStatus.Pending)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: "Only pending repairs can be taken.");
        }

        repair.User = user;
        repair.UserId = user.Id;
        repair.Status = RepairStatus.InProgress;

        await _context.SaveChangesAsync();

        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs/{id}/complete
    // Only the assigned worker or an admin can complete a repair.
    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> CompleteRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserNotFound();

        var repair = await FindRepairWithWorker(id);

        if (repair == null)
            return RepairNotFound();

        if (repair.Status != RepairStatus.InProgress)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: "Only repairs in progress can be completed.");
        }

        if (user.Role != UserRole.Admin && user.Id != repair.UserId)
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                detail: "Only the assigned worker or an admin can complete this repair.");
        }

        repair.Status = RepairStatus.Completed;

        await _context.SaveChangesAsync();

        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs/{id}/cancel
    [RequirePermission(Permission.EditRepairs)]
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserNotFound();

        var repair = await FindRepairWithWorker(id);

        if (repair == null)
            return RepairNotFound();

        if (repair.Status == RepairStatus.Completed)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: "Repair is already completed.");
        }

        if (repair.Status == RepairStatus.Cancelled)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: "Repair is already cancelled.");
        }

        if (user.Role != UserRole.Admin && user.Id != repair.UserId)
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                detail: "Only the assigned worker or an admin can cancel this repair.");
        }

        repair.Status = RepairStatus.Cancelled;

        await _context.SaveChangesAsync();

        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs/{id}/return
    // Gives the repair back to the queue. Allowed for the assigned worker
    // and for users who can discharge other workers.
    [HttpPost("{id:int}/return")]
    public async Task<IActionResult> ReturnRepair(int id)
    {
        var user = await _userService.GetCurrentUser(User);

        if (user == null)
            return CurrentUserNotFound();

        var repair = await FindRepairWithWorker(id);

        if (repair == null)
            return RepairNotFound();

        if (repair.Status != RepairStatus.InProgress)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: "Only repairs in progress can be returned.");
        }

        if (user.Id != repair.UserId &&
            !_permissionService.HasPermission(user, Permission.DischargeUsers))
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                detail: "Only the assigned worker or a user with DischargeUsers can return this repair.");
        }

        repair.User = null;
        repair.UserId = null;
        repair.Status = RepairStatus.Pending;

        await _context.SaveChangesAsync();

        return Ok(RepairResponseDto.FromEntity(repair));
    }


    private Task<Repair?> FindRepairWithWorker(int id)
    {
        return _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    private ObjectResult RepairNotFound()
    {
        return Problem(
            statusCode: StatusCodes.Status404NotFound,
            detail: "Repair not found.");
    }

    // The token is valid, but its user no longer exists (e.g. was deleted).
    private ObjectResult CurrentUserNotFound()
    {
        return Problem(
            statusCode: StatusCodes.Status401Unauthorized,
            detail: "User not found.");
    }

    // Returns the errors collected in ModelState with the same title
    // as the automatic [ApiController] validation response.
    private ActionResult InvalidRepairData()
    {
        return ValidationProblem(
            title: "Validation failed.",
            modelStateDictionary: ModelState);
    }

    // Business rules that the data annotations on the DTO cannot express.
    // Errors are added to ModelState, so the client gets them per field,
    // just like the errors from the data annotations.
    private void ValidateRepairData(RepairDataDto dto)
    {
        // A custom product is any device outside the catalogue,
        // so its serial number is optional and not checked.
        if (!dto.IsCustomProduct)
        {
            if (!ProductCatalog.IsKnownProduct(dto.Product))
            {
                ModelState.AddModelError(
                    "product", "Wybierz produkt z listy.");
            }
            else
            {
                var serialError = ProductCatalog.ValidateSerialNumber(
                    dto.Product, dto.SerialNumber);

                if (serialError != null)
                    ModelState.AddModelError("serialNumber", serialError);
            }
        }

        if (dto.HasWarranty && dto.PurchaseDate == null)
        {
            ModelState.AddModelError(
                "purchaseDate",
                "Purchase date is required for warranty repairs.");
        }

        if (dto.HasWarranty &&
            string.IsNullOrWhiteSpace(dto.PurchaseInvoiceNumber))
        {
            ModelState.AddModelError(
                "purchaseInvoiceNumber",
                "Purchase invoice number is required for warranty repairs.");
        }

        if (dto.HasContract &&
            string.IsNullOrWhiteSpace(dto.ContractNumber))
        {
            ModelState.AddModelError(
                "contractNumber",
                "Contract number is required when contract is selected.");
        }
    }

    // Copies the fields shared by the create and edit forms.
    private static void CopyRepairData(RepairDataDto dto, Repair repair)
    {
        repair.Product = dto.Product;
        repair.IsCustomProduct = dto.IsCustomProduct;
        repair.SerialNumber = dto.SerialNumber?.Trim() ?? "";
        repair.Description = dto.Description;

        repair.ReporterName = dto.ReporterName;
        repair.ReporterSurname = dto.ReporterSurname;
        repair.ReporterPhone = dto.ReporterPhone;
        repair.ReporterEmail = NormalizeEmail(dto.ReporterEmail);

        repair.CompanyName = dto.CompanyName;
        repair.CompanyAddress = dto.CompanyAddress;
        repair.CompanyPostalCode = dto.CompanyPostalCode;
        repair.CompanyCity = dto.CompanyCity;
        repair.CompanyNip = dto.CompanyNip;

        repair.HasWarranty = dto.HasWarranty;
        repair.PurchaseDate = dto.PurchaseDate;
        repair.PurchaseInvoiceNumber = dto.PurchaseInvoiceNumber;

        repair.HasContract = dto.HasContract;
        repair.ContractNumber = dto.ContractNumber;
    }

    // People type the same address in different letter case,
    // so emails are stored and compared in lower case.
    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
