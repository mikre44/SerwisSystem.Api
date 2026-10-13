using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Text.Encodings.Web;
using SerwisSystem.Api.Models;

namespace SerwisSystem.Api.Services;

public class EmailService(IConfiguration configuration)
{
    private string RequiredSetting(string name) => configuration["Email:" + name]
        ?? throw new InvalidOperationException($"Missing email configuration: Email:{name}");

    public static MimeEntity CreateConfirmationBody(string recipientName, string trackingCode, string product, string serialNumber)
    {
        var encode = HtmlEncoder.Default;
        return new BodyBuilder
        {
            HtmlBody = $"""
                <h2>Przyjęto zgłoszenie naprawy</h2>
                <p>Dzień dobry, {encode.Encode(recipientName)},</p>
                <p><strong>Kod śledzenia:</strong> {encode.Encode(trackingCode)}<br>
                <strong>Produkt:</strong> {encode.Encode(product)}<br>
                <strong>Numer seryjny:</strong> {encode.Encode(serialNumber)}</p>
                <p>Aby sprawdzić status naprawy, podaj kod śledzenia, adres e-mail oraz pierwotny numer seryjny (jeśli podano go w zgłoszeniu).</p>
                """,
            TextBody = $"Dzień dobry, {recipientName}. Przyjęto zgłoszenie naprawy. Kod śledzenia: {trackingCode}. Produkt: {product}. Numer seryjny: {serialNumber}. Aby sprawdzić status naprawy, podaj ten kod, adres e-mail i pierwotny numer seryjny (jeśli podano go w zgłoszeniu)."
        }.ToMessageBody();
    }

    public async Task SendRepairCreatedEmail(string recipientEmail, string recipientName, string trackingCode,
        string product, string serialNumber, CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(configuration["Email:FromName"] ?? "Serwis", RequiredSetting("FromEmail")));
        message.To.Add(new MailboxAddress(recipientName, recipientEmail));
        message.Subject = $"Przyjęto zgłoszenie naprawy {trackingCode}";
        message.Body = CreateConfirmationBody(recipientName, trackingCode, product, serialNumber);
        await SendEmail(message, cancellationToken);
    }

    public static string CreateRepairMethodBody(Repair repair) => $"""
        Powód wiadomości: wybrano sposób realizacji „{RepairMethodLabels.GetLabel(repair.RepairMethod)}”.

        Numer naprawy: {repair.Id}
        Miejscowość: {repair.CompanyCity}
        Firma: {repair.CompanyName}
        Adres: {repair.CompanyAddress}
        Kod pocztowy: {repair.CompanyPostalCode}

        Produkt: {repair.Product}
        Numer seryjny: {repair.SerialNumber}
        Opis problemu: {repair.Description}

        Osoba kontaktowa: {repair.ReporterName} {repair.ReporterSurname}
        Telefon: {repair.ReporterPhone}
        E-mail: {repair.ReporterEmail}
        """;

    public async Task SendRepairMethodChangedEmail(Repair repair, CancellationToken cancellationToken)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(configuration["Email:FromName"] ?? "Serwis", RequiredSetting("FromEmail")));
        message.To.Add(MailboxAddress.Parse(RequiredSetting("RepairNotificationRecipient")));
        message.Subject = $"{RepairMethodLabels.GetLabel(repair.RepairMethod)} — {repair.CompanyCity} — naprawa nr {repair.Id}";
        message.Body = new TextPart("plain") { Text = CreateRepairMethodBody(repair) };
        await SendEmail(message, cancellationToken);
    }

    private async Task SendEmail(MimeMessage message, CancellationToken cancellationToken)
    {
        var host = RequiredSetting("SmtpHost");
        if (!int.TryParse(RequiredSetting("SmtpPort"), out var port) || port is < 1 or > 65535)
            throw new InvalidOperationException("Invalid SMTP port.");
        var username = RequiredSetting("Username");
        var password = RequiredSetting("Password");
        using var client = new SmtpClient { Timeout = 30000 };
        await client.ConnectAsync(host, port, port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls, cancellationToken);
        await client.AuthenticateAsync(username, password, cancellationToken);
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
