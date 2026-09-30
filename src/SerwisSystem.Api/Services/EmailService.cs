using System.Net;

namespace SerwisSystem.Api.Services;

// Writes the emails the application sends. Delivery is left to IEmailSender.
public class EmailService
{
    private readonly IEmailSender _emailSender;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IEmailSender emailSender, ILogger<EmailService> logger)
    {
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task SendRepairCreatedEmail(
        string recipientEmail,
        string recipientName,
        int repairId,
        string product,
        string? serialNumber)
    {
        // Every value comes from an anonymous form. Without encoding, a name like
        // <a href="...">Pay here</a> would become a real link in our own email.
        var safeName = WebUtility.HtmlEncode(recipientName);
        var safeProduct = WebUtility.HtmlEncode(product);

        // Many products have no serial number; an empty "Numer seryjny:" line would look like a mistake.
        var serialNumberLine = string.IsNullOrEmpty(serialNumber)
            ? ""
            : $"<br/><strong>Numer seryjny:</strong> {WebUtility.HtmlEncode(serialNumber)}";

        // Customers are Polish, so the email is in Polish.
        var subject = $"Przyjęto zgłoszenie naprawy nr {repairId}";

        var body = $"""
            <h2>Przyjęliśmy zgłoszenie naprawy</h2>

            <p>Dzień dobry, {safeName},</p>

            <p>
                Twoje zgłoszenie naprawy zostało zarejestrowane.
            </p>

            <p>
                <strong>Numer naprawy:</strong> {repairId}<br/>
                <strong>Produkt:</strong> {safeProduct}{serialNumberLine}
            </p>

            <p>
                Za pomocą numeru naprawy i adresu e-mail
                możesz sprawdzić aktualny status naprawy.
            </p>

            <p>
                Ta wiadomość została wygenerowana automatycznie.
            </p>
            """;

        await _emailSender.SendAsync(recipientEmail, recipientName, subject, body);

        _logger.LogInformation(
            "Confirmation email for repair {RepairId} sent.", repairId);
    }
}
