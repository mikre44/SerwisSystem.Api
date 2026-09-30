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
        string serialNumber)
    {
        // Every value comes from an anonymous form. Without encoding, a name like
        // <a href="...">Pay here</a> would become a real link in our own email.
        var safeName = WebUtility.HtmlEncode(recipientName);
        var safeProduct = WebUtility.HtmlEncode(product);
        var safeSerialNumber = WebUtility.HtmlEncode(serialNumber);

        var subject = $"Repair request #{repairId} received";

        var body = $"""
            <h2>Repair request received</h2>

            <p>Hello {safeName},</p>

            <p>
                Your repair request has been successfully created.
            </p>

            <p>
                <strong>Repair number:</strong> {repairId}<br/>
                <strong>Product:</strong> {safeProduct}<br/>
                <strong>Serial number:</strong> {safeSerialNumber}
            </p>

            <p>
                You can use your repair number and email address
                to check the current repair status.
            </p>

            <p>
                This message was generated automatically.
            </p>
            """;

        await _emailSender.SendAsync(recipientEmail, recipientName, subject, body);

        _logger.LogInformation(
            "Confirmation email for repair {RepairId} sent.", repairId);
    }
}
