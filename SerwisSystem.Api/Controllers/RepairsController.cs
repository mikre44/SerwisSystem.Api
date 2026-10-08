using Microsoft.AspNetCore.RateLimiting;
using Npgsql;
﻿using Microsoft.AspNetCore.Authorization;
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
    private readonly ILogger<RepairsController> _logger;

    public RepairsController(
    AppDbContext context,
    PermissionService permissionService,
    UserService userService,
    EmailService emailService, ILogger<RepairsController> logger)
    {
        _context = context;
        _permissionService = permissionService;
        _userService = userService;
        _emailService = emailService;
        _logger = logger;
    }


    private bool IsValidPhone(string phone)
    {
        return System.Text.RegularExpressions.Regex.IsMatch(
            phone,
            @"^(\+)?\d{7,15}$"
        );
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
                    .ThenByDescending(r => r.ReporterName)
                : query.OrderBy(r => r.ReporterSurname)
                    .ThenBy(r => r.ReporterName),

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


        var totalCount = await query.CountAsync(HttpContext.RequestAborted);


        var repairs = await ((IOrderedQueryable<Repair>)query)
            .ThenBy(r => r.Id)
            .Skip((int)Math.Min((long)(page - 1) * pageSize, int.MaxValue))
            .Take(pageSize)
            .ToListAsync(HttpContext.RequestAborted);


        return Ok(new
        {
            Items = repairs.Select(repair => RepairResponseMapper.CreateResponse(repair, repair.User?.Username)),

            Page = page,
            PageSize = pageSize,

            TotalCount = totalCount,

            TotalPages = (int)Math.Ceiling(
                totalCount / (double)pageSize
            )
        });
    }


    // GET api/repairs/{id:int}
    [RequirePermission("ReadRepairs")]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRepair(int id)
    {
        var repair = await _context.Repairs
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id, HttpContext.RequestAborted);

        if (repair == null)
            return NotFound();

        return Ok(RepairResponseMapper.CreateResponse(repair, repair.User?.Username));
    }


    // POST api/repairs
    // Public endpoint used by customer application
    [AllowAnonymous]
    [EnableRateLimiting("repair-create")]
    [HttpPost]
    public async Task<IActionResult> CreateRepair(
        CreateRepairDto dto)
    {
        // Warranty validation
        if (dto.HasWarranty)
        {
            if (dto.PurchaseDate == null)
            {
                return BadRequest(new ApiErrorResponse(400, "Data zakupu jest wymagana przy naprawie gwarancyjnej."));
            }

            if (string.IsNullOrWhiteSpace(
                dto.PurchaseInvoiceNumber))
            {
                return BadRequest(new ApiErrorResponse(400, "Numer faktury zakupu jest wymagany przy naprawie gwarancyjnej."));
            }
        }


        if (!IsValidPhone(dto.ReporterPhone))// Phone number validation
        {
            return BadRequest(new ApiErrorResponse(400, "Numer telefonu musi zawierać od 7 do 15 cyfr i może zaczynać się znakiem +."));
        }

        if (dto.IsCustomProduct &&
            string.IsNullOrWhiteSpace(dto.Product))
        {
            return BadRequest(new ApiErrorResponse(400, "Podaj nazwę urządzenia spoza listy."));
        }


        // Contract validation
        if (dto.HasContract &&
            string.IsNullOrWhiteSpace(dto.ContractNumber))
        {
            return BadRequest(new ApiErrorResponse(400, "Numer umowy jest wymagany po zaznaczeniu opcji umowy."));
        }

        // Required service consent
        if (!dto.ServiceDataConsent)
        {
            return BadRequest(new ApiErrorResponse(400, "Zgoda na przetwarzanie danych do celów serwisowych jest wymagana."));
        }


        var repair = new Repair
        {
            Product = dto.Product,
            IsCustomProduct = dto.IsCustomProduct,
            SerialNumber = dto.SerialNumber ?? "",
            Description = dto.Description,

            ReporterName = dto.ReporterName,
            ReporterSurname = dto.ReporterSurname,
            ReporterPhone = dto.ReporterPhone,
            ReporterEmail = dto.ReporterEmail,

            CompanyName = dto.CompanyName,
            CompanyAddress = dto.CompanyAddress,
            CompanyPostalCode = dto.CompanyPostalCode,
            CompanyCity = dto.CompanyCity,
            CompanyNip = dto.CompanyNip,

            HasWarranty = dto.HasWarranty,
            PurchaseDate = dto.PurchaseDate,
            PurchaseInvoiceNumber = dto.PurchaseInvoiceNumber,

            HasContract = dto.HasContract,
            ContractNumber = dto.ContractNumber,

            ServiceDataConsent = dto.ServiceDataConsent,

            MarketingConsent = dto.MarketingConsent
        };


        repair.TrackingSerialNumber = (dto.SerialNumber ?? "").Trim();
        repair.ReporterEmail = dto.ReporterEmail.Trim();
        var trackingCode = "";
        _context.Repairs.Add(repair);
        for (var attempt = 0; ; attempt++)
        {
            trackingCode = RepairTracking.GenerateCode();
            repair.TrackingCodeHash = RepairTracking.HashCode(trackingCode);
            try { await _context.SaveChangesAsync(); break; }
            catch (DbUpdateException exception) when (attempt < 5 && exception.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "IX_Repairs_TrackingCodeHash" }) { }
        }

        try// even if the mail doesnt work the repair will be created
        {
            using var emailTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            await _emailService.SendRepairCreatedEmail(
                repair.ReporterEmail,
                $"{repair.ReporterName} {repair.ReporterSurname}",
                trackingCode,
                repair.Product,
                repair.SerialNumber, emailTimeout.Token
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Confirmation email failed for repair {RepairId}.", repair.Id);
        }

        return StatusCode(201, new { trackingCode, repair.Product, repair.SerialNumber });
    }


    // POST api/repairs/check
    // Public repair status check
    [AllowAnonymous]
    [EnableRateLimiting("repair-check")]
    [HttpPost("check")]
    public async Task<IActionResult> CheckRepair(CheckRepairDto dto, CancellationToken cancellationToken)
    {
        var codeHash = RepairTracking.HashCode(dto.Code);
        var repair = await _context.Repairs.AsNoTracking()
            .SingleOrDefaultAsync(repair => repair.TrackingCodeHash == codeHash, cancellationToken);
        if (repair == null || !string.Equals(repair.ReporterEmail.Trim(), dto.Email.Trim(), StringComparison.OrdinalIgnoreCase)
            || (!string.IsNullOrEmpty(repair.TrackingSerialNumber) && !string.Equals(
                repair.TrackingSerialNumber, dto.SerialNumber?.Trim(), StringComparison.OrdinalIgnoreCase)))
            return NotFound(new ApiErrorResponse(404, "Nie znaleziono naprawy."));
        return Ok(new PublicRepairResponseDto { Product = repair.Product, Status = repair.Status.ToString(), CreatedAt = repair.CreatedAt });
    }

    // PUT api/repairs/{id:int}
    [RequirePermission("EditRepairs")]
    [HttpPut("{id:int}")]
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
        if (repair.Version != updatedRepair.Version) return Conflict(new ApiErrorResponse(409, "Dane naprawy zostały zmienione. Wczytaj je ponownie przed zapisaniem."));


        // Warranty validation
        if (updatedRepair.HasWarranty)
        {
            if (updatedRepair.PurchaseDate == null)
            {
                return BadRequest(new ApiErrorResponse(400, "Data zakupu jest wymagana przy naprawie gwarancyjnej."));
            }

            if (string.IsNullOrWhiteSpace(
                updatedRepair.PurchaseInvoiceNumber))
            {
                return BadRequest(new ApiErrorResponse(400, "Numer faktury zakupu jest wymagany przy naprawie gwarancyjnej."));
            }
        }


        // Contract validation
        if (updatedRepair.HasContract &&
            string.IsNullOrWhiteSpace(
                updatedRepair.ContractNumber))
        {
            return BadRequest(new ApiErrorResponse(400, "Numer umowy jest wymagany po zaznaczeniu opcji umowy."));
        }


        // If repair is manually moved into an active/final status
        // and has no worker, assign the editing user.
        if (
            updatedRepair.Status == RepairStatus.Completed ||
            updatedRepair.Status == RepairStatus.Cancelled ||
            updatedRepair.Status == RepairStatus.InProgress
        )
        {
            if (repair.UserId == null)
            {
                repair.UserId = user.Id;
                repair.User = user;
            }
        }


        if (updatedRepair.Status != null)
        {
            repair.Status =
                (RepairStatus)updatedRepair.Status;
        }


        repair.Product = updatedRepair.Product;
        repair.IsCustomProduct = updatedRepair.IsCustomProduct;
        repair.SerialNumber = updatedRepair.SerialNumber ?? "";
        repair.Description = updatedRepair.Description;

        repair.ReporterName = updatedRepair.ReporterName;
        repair.ReporterSurname = updatedRepair.ReporterSurname;
        repair.ReporterPhone = updatedRepair.ReporterPhone;
        repair.ReporterEmail = updatedRepair.ReporterEmail;

        repair.CompanyName = updatedRepair.CompanyName;
        repair.CompanyAddress = updatedRepair.CompanyAddress;
        repair.CompanyPostalCode = updatedRepair.CompanyPostalCode;
        repair.CompanyCity = updatedRepair.CompanyCity;
        repair.CompanyNip = updatedRepair.CompanyNip;

        repair.HasWarranty = updatedRepair.HasWarranty;
        repair.PurchaseDate = updatedRepair.PurchaseDate;
        repair.PurchaseInvoiceNumber = updatedRepair.PurchaseInvoiceNumber;


        repair.HasContract = updatedRepair.HasContract;
        repair.ContractNumber = updatedRepair.ContractNumber;

        // Pending repairs should not have an assigned worker.
        if (repair.Status == RepairStatus.Pending)
        {
            repair.UserId = null;
            repair.User = null;
        }


        await _context.SaveChangesAsync();


        return Ok(RepairResponseMapper.CreateResponse(repair, repair.User?.Username));
    }


    // DELETE api/repairs/{id:int}
    [RequirePermission("DeleteRepairs")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRepair(int id, [FromBody] RepairVersionDto request)
    {
        var user =
            await _userService.GetCurrentUser(User);

        if (user == null)
            return Unauthorized();


        var repair =
            await _context.Repairs.Include(repair => repair.User).SingleOrDefaultAsync(repair => repair.Id == id);

        if (repair == null)
            return NotFound();
        if (repair.Version != request.Version) return Conflict(new ApiErrorResponse(409, "Dane naprawy zostały zmienione. Wczytaj je ponownie przed kontynuowaniem."));


        _context.Repairs.Remove(repair);

        await _context.SaveChangesAsync();


        return NoContent();
    }


    // POST api/repairs/{id:int}/take
    [RequirePermission("TakeRepairs")]
    [HttpPost("{id:int}/take")]
    public async Task<IActionResult> TakeRepair(int id, [FromBody] RepairVersionDto request)
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
        if (repair.Version != request.Version) return Conflict(new ApiErrorResponse(409, "Dane naprawy zostały zmienione. Wczytaj je ponownie przed kontynuowaniem."));


        if (repair.UserId != null)
        {
            return BadRequest(new ApiErrorResponse(400, "Naprawa jest już przypisana do pracownika."));
        }


        if (repair.Status != RepairStatus.Pending)
        {
            return BadRequest(new ApiErrorResponse(400, "Naprawa musi mieć status oczekującej."));
        }


        repair.UserId = user.Id;
        repair.User = user;
        repair.Status = RepairStatus.InProgress;


        await _context.SaveChangesAsync();


        return Ok(RepairResponseMapper.CreateResponse(repair, repair.User?.Username));
    }


    // POST api/repairs/{id:int}/complete
    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> CompleteRepair(int id, [FromBody] RepairVersionDto request)
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
        if (repair.Version != request.Version) return Conflict(new ApiErrorResponse(409, "Dane naprawy zostały zmienione. Wczytaj je ponownie przed kontynuowaniem."));


        if (repair.UserId == null)
        {
            return BadRequest(new ApiErrorResponse(400, "Naprawa nie jest przypisana do żadnego pracownika."));
        }


        if (
            user.Role != UserRole.Admin &&
            user.Id != repair.UserId
        )
        {
            return BadRequest(new ApiErrorResponse(400, "Naprawa jest przypisana do innego pracownika."));
        }


        if (repair.Status != RepairStatus.InProgress)
        {
            return BadRequest(new ApiErrorResponse(400, "Można zakończyć wyłącznie naprawę będącą w trakcie realizacji."));
        }


        repair.Status = RepairStatus.Completed;


        await _context.SaveChangesAsync();


        return Ok(RepairResponseMapper.CreateResponse(repair, repair.User?.Username));
    }


    // POST api/repairs/{id:int}/cancel
    [RequirePermission("EditRepairs")]
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelRepair(int id, [FromBody] RepairVersionDto request)
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
        if (repair.Version != request.Version) return Conflict(new ApiErrorResponse(409, "Dane naprawy zostały zmienione. Wczytaj je ponownie przed kontynuowaniem."));


        if (repair.Status == RepairStatus.Completed)
        {
            return BadRequest(new ApiErrorResponse(400, "Naprawa została już zakończona."));
        }


        if (repair.Status == RepairStatus.Cancelled)
        {
            return BadRequest(new ApiErrorResponse(400, "Naprawa została już anulowana."));
        }


        if (
            user.Role != UserRole.Admin &&
            user.Id != repair.UserId
        )
        {
            return BadRequest(new ApiErrorResponse(400, "Naprawa jest przypisana do innego pracownika."));
        }


        repair.Status = RepairStatus.Cancelled;


        await _context.SaveChangesAsync();


        return Ok(RepairResponseMapper.CreateResponse(repair, repair.User?.Username));
    }


    // POST api/repairs/{id:int}/return
    [HttpPost("{id:int}/return")]
    public async Task<IActionResult> ReturnRepair(int id, [FromBody] RepairVersionDto request)
    {
        var repair =
            await _context.Repairs.Include(repair => repair.User).SingleOrDefaultAsync(repair => repair.Id == id);

        if (repair == null)
            return NotFound();
        if (repair.Version != request.Version) return Conflict(new ApiErrorResponse(409, "Dane naprawy zostały zmienione. Wczytaj je ponownie przed kontynuowaniem."));


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
            return BadRequest(new ApiErrorResponse(400, "Naprawa została już zakończona."));
        }


        if (repair.Status == RepairStatus.Cancelled)
        {
            return BadRequest(new ApiErrorResponse(400, "Naprawa została już anulowana."));
        }


        repair.UserId = null;
        repair.Status = RepairStatus.Pending;


        await _context.SaveChangesAsync();


        return Ok(RepairResponseMapper.CreateResponse(repair, repair.User?.Username));
    }
}