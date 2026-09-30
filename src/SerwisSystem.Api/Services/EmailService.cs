using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace SerwisSystem.Api.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendRepairCreatedEmail(
        string recipientEmail,
        string recipientName,
        int repairId,
        string product,
        string serialNumber)
    {
        var host = GetRequiredSetting("SmtpHost");
        var username = GetRequiredSetting("Username");
        var password = GetRequiredSetting("Password");
        var fromEmail = GetRequiredSetting("FromEmail");
        var fromName = _configuration["Email:FromName"] ?? "Service";

        if (!int.TryParse(GetRequiredSetting("SmtpPort"), out var port))
            throw new InvalidOperationException("Invalid SMTP port.");

        // Every value comes from an anonymous form. Without encoding, a name like
        // <a href="...">Pay here</a> would become a real link in our own email.
        var safeName = WebUtility.HtmlEncode(recipientName);
        var safeProduct = WebUtility.HtmlEncode(product);
        var safeSerialNumber = WebUtility.HtmlEncode(serialNumber);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(new MailboxAddress(recipientName, recipientEmail));
        message.Subject = $"Repair request #{repairId} received";

        message.Body = new TextPart("html")
        {
            Text = $"""
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
                """
        };

        using var client = new SmtpClient();

        await client.ConnectAsync(host, port, SecureSocketOptions.Auto);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation(
            "Confirmation email for repair {RepairId} sent.", repairId);
    }

    private string GetRequiredSetting(string name)
    {
        var value = _configuration[$"Email:{name}"];

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"Missing email configuration: Email:{name}");
        }

        return value;
    }
}
