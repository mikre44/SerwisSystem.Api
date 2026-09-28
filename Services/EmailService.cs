using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace SerwisSystem.Api.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendRepairCreatedEmail(
        string recipientEmail,
        string recipientName,
        int repairId,
        string product,
        string serialNumber)
    {
        var host = _configuration["Email:SmtpHost"];
        var portString = _configuration["Email:SmtpPort"];
        var username = _configuration["Email:Username"];
        var password = _configuration["Email:Password"];
        var fromEmail = _configuration["Email:FromEmail"];
        var fromName = _configuration["Email:FromName"];

        var missing = new List<string>();

        if (string.IsNullOrWhiteSpace(host))
            missing.Add("Email:SmtpHost");

        if (string.IsNullOrWhiteSpace(portString))
            missing.Add("Email:SmtpPort");

        if (string.IsNullOrWhiteSpace(username))
            missing.Add("Email:Username");

        if (string.IsNullOrWhiteSpace(password))
            missing.Add("Email:Password");

        if (string.IsNullOrWhiteSpace(fromEmail))
            missing.Add("Email:FromEmail");

        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"Missing email configuration: {string.Join(", ", missing)}"
            );
        }

       

        if (!int.TryParse(portString, out var port))
        {
            throw new InvalidOperationException(
                "Invalid SMTP port."
            );
        }

        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                fromName ?? "Service",
                fromEmail
            )
        );

        message.To.Add(
            new MailboxAddress(
                recipientName,
                recipientEmail
            )
        );

        message.Subject =
            $"Repair request #{repairId} received";

        message.Body = new TextPart("html")
        {
            Text = $"""
                <h2>Repair request received</h2>

                <p>Hello {recipientName},</p>

                <p>
                    Your repair request has been successfully created.
                </p>

                <p>
                    <strong>Repair number:</strong> {repairId}<br/>
                    <strong>Product:</strong> {product}<br/>
                    <strong>Serial number:</strong> {serialNumber}
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

        await client.ConnectAsync(
            host,
            port,
            SecureSocketOptions.Auto
        );

        await client.AuthenticateAsync(
            username,
            password
        );

        await client.SendAsync(message);

        await client.DisconnectAsync(true);
    }
}