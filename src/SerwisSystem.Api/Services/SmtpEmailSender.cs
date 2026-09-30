using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace SerwisSystem.Api.Services;

// Sends emails through the SMTP server from the "Email" configuration section.
public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;

    public SmtpEmailSender(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var host = GetRequiredSetting("SmtpHost");
        var username = GetRequiredSetting("Username");
        var password = GetRequiredSetting("Password");
        var fromEmail = GetRequiredSetting("FromEmail");
        var fromName = _configuration["Email:FromName"] ?? "Service";

        if (!int.TryParse(GetRequiredSetting("SmtpPort"), out var port))
            throw new InvalidOperationException("Invalid SMTP port.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();

        await client.ConnectAsync(host, port, SecureSocketOptions.Auto);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
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
