using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    public RepairsController(
    AppDbContext context,
    PermissionService permissionService,
    UserService userService,
    EmailService emailService)
    {
        _context = context;
        _permissionService = permissionService;
        _userService = userService;
        _emailService = emailService;
    }


    // Business rules that the data annotations on the DTO cannot express.
    // Errors are added to ModelState, so ValidationProblem() returns them
    // in the same format as the automatic [ApiController] validation.
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
        repair.ReporterEmail = dto.ReporterEmail;

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


    // GET api/repairs
    [RequirePermission("ReadRepairs")]
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
        // Page cannot be lower than 1
        page = Math.Max(page, 1);

        // Page size must stay between 1 and 100
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Repairs
            .Include(r => r.User)
            .AsQueryable();


        // Search
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


        // Filter by one or multiple statuses
        if (statuses != null && statuses.Count > 0)
        {
            query = query.Where(r =>
                statuses.Contains(r.Status));
        }


        // Show only repairs assigned to logged user
        if (mine)
        {
            var currentUser =
                await _userService.GetCurrentUser(User);

            if (currentUser == null)
                return Unauthorized();

            query = query.Where(r =>
                r.UserId == currentUser.Id);
        }


        // Sorting
        query = sortBy.ToLower() switch
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
                    .ThenBy(r => r.ReporterName)
                : query.OrderBy(r => r.ReporterSurname)
                    .ThenByDescending(r => r.ReporterName),

            "status" => descending
                ? query
                    .OrderByDescending(r => r.Status)
                    .ThenByDescending(r => r.CreatedAt)
                : query
                    .OrderBy(r => r.Status)
                    .ThenBy(r => r.CreatedAt),

            "address" => descending
                ? query.OrderByDescending(r => r.CompanyAddress)
                : query.OrderBy(r => r.CompanyAddress),
            "createdat" => descending
                ? query.OrderByDescending(r => r.CreatedAt)
                : query.OrderBy(r => r.CreatedAt),

            _ => query.OrderByDescending(r => r.CreatedAt)
        };


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

            TotalPages = (int)Math.Ceiling(
                totalCount / (double)pageSize
            )
        });
    }


    // GET api/repairs/{id}
    [RequirePermission("ReadRepairs")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRepair(int id)
    {
        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();

        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs
    // Public endpoint used by customer application
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> CreateRepair(
        CreateRepairDto dto)
    {
        ValidateRepairData(dto);

        if (!dto.ServiceDataConsent)
        {
            ModelState.AddModelError(
                "serviceDataConsent",
                "Consent to process personal data for service purposes is required.");
        }

        if (!ModelState.IsValid)
            return ValidationProblem();


        var repair = new Repair
        {
            ServiceDataConsent = dto.ServiceDataConsent,
            MarketingConsent = dto.MarketingConsent
        };

        CopyRepairData(dto, repair);

        _context.Repairs.Add(repair);

        await _context.SaveChangesAsync();

        try// even if the mail doesnt work the repair will be created
        {
            await _emailService.SendRepairCreatedEmail(
                repair.ReporterEmail,
                $"{repair.ReporterName} {repair.ReporterSurname}",
                repair.Id,
                repair.Product,
                repair.SerialNumber
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Failed to send confirmation email: {ex.Message}"
            );
        }

        return CreatedAtAction(
            nameof(GetRepair),
            new { id = repair.Id },
            RepairResponseDto.FromEntity(repair)
        );
    }


    // POST api/repairs/check
    // Public repair status check
    [AllowAnonymous]
    [HttpPost("check")]
    public async Task<IActionResult> CheckRepair(CheckRepairDto dto)
    {
        var repair = await _context.Repairs
            .FirstOrDefaultAsync(r =>
                r.Id == dto.Id &&
                r.ReporterEmail == dto.Email
            );

        if (repair == null)
            return NotFound("Repair not found.");

        return Ok(new PublicRepairResponseDto
        {
            Product = repair.Product,
            Status = repair.Status.ToString(),
            CreatedAt = repair.CreatedAt
        });
    }


    // PUT api/repairs/{id}
    [RequirePermission("EditRepairs")]
    [HttpPut("{id}")]
    public async Task<IActionResult> EditRepair(
        int id,
        UpdateRepairDto updatedRepair)
    {
        var user =
            await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();


        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();


        ValidateRepairData(updatedRepair);

        if (!ModelState.IsValid)
            return ValidationProblem();

        // If repair is manually moved into an active/final status
        // and has no worker, assign the editing user.
        if (
            updatedRepair.Status == RepairStatus.Completed ||
            updatedRepair.Status == RepairStatus.Cancelled ||
            updatedRepair.Status == RepairStatus.InProgress
        )
        {
            repair.UserId ??= user.Id;
        }


        if (updatedRepair.Status != null)
        {
            repair.Status =
                (RepairStatus)updatedRepair.Status;
        }


        CopyRepairData(updatedRepair, repair);

        // Pending repairs should not have an assigned worker.
        if (repair.Status == RepairStatus.Pending)
        {
            repair.UserId = null;
            repair.User = null;
        }


        await _context.SaveChangesAsync();


        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // DELETE api/repairs/{id}
    [RequirePermission("DeleteRepairs")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRepair(int id)
    {
        var user =
            await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();


        var repair =
            await _context.Repairs.FindAsync(id);

        if (repair == null)
            return NotFound();


        _context.Repairs.Remove(repair);

        await _context.SaveChangesAsync();


        return NoContent();
    }


    // POST api/repairs/{id}/take
    [RequirePermission("TakeRepairs")]
    [HttpPost("{id}/take")]
    public async Task<IActionResult> TakeRepair(int id)
    {
        var user =
            await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();


        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();


        if (repair.UserId != null)
        {
            return BadRequest(
                "Repair already assigned to a user."
            );
        }


        if (repair.Status != RepairStatus.Pending)
        {
            return BadRequest(
                "Repair must be pending."
            );
        }


        repair.UserId = user.Id;
        repair.User = user;
        repair.Status = RepairStatus.InProgress;


        await _context.SaveChangesAsync();


        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs/{id}/complete
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteRepair(int id)
    {
        var user =
            await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();


        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();


        if (repair.UserId == null)
        {
            return BadRequest(
                "Repair has not been assigned to any user."
            );
        }


        if (
            user.Role != UserRole.Admin &&
            user.Id != repair.UserId
        )
        {
            return BadRequest(
                "Repair is assigned to a different user."
            );
        }


        if (repair.Status != RepairStatus.InProgress)
        {
            return BadRequest(
                "Only repairs in progress can be completed."
            );
        }


        repair.Status = RepairStatus.Completed;


        await _context.SaveChangesAsync();


        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs/{id}/cancel
    [RequirePermission("EditRepairs")]
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelRepair(int id)
    {
        var user =
            await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();


        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();


        if (repair.Status == RepairStatus.Completed)
        {
            return BadRequest(
                "Repair is already completed."
            );
        }


        if (repair.Status == RepairStatus.Cancelled)
        {
            return BadRequest(
                "Repair has already been cancelled."
            );
        }


        if (
            user.Role != UserRole.Admin &&
            user.Id != repair.UserId
        )
        {
            return BadRequest(
                "Repair is assigned to a different user."
            );
        }


        repair.Status = RepairStatus.Cancelled;


        await _context.SaveChangesAsync();


        return Ok(RepairResponseDto.FromEntity(repair));
    }


    // POST api/repairs/{id}/return
    [HttpPost("{id}/return")]
    public async Task<IActionResult> ReturnRepair(int id)
    {
        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (repair == null)
            return NotFound();


        var user =
            await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();


        if (
            !_permissionService.HasPermission(
                user,
                "DischargeUsers"
            ) &&
            user.Id != repair.UserId
        )
        {
            return Forbid();
        }


        if (repair.Status == RepairStatus.Completed)
        {
            return BadRequest(
                "Repair has already been completed."
            );
        }


        if (repair.Status == RepairStatus.Cancelled)
        {
            return BadRequest(
                "Repair has already been cancelled."
            );
        }


        repair.UserId = null;
        repair.User = null;
        repair.Status = RepairStatus.Pending;


        await _context.SaveChangesAsync();


        return Ok(RepairResponseDto.FromEntity(repair));
    }
}