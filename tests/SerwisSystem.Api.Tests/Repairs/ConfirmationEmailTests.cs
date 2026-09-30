using SerwisSystem.Api.Tests.Infrastructure;

namespace SerwisSystem.Api.Tests.Repairs;

[Collection(ApiCollection.Name)]
public class ConfirmationEmailTests : ApiTestBase
{
    public ConfirmationEmailTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Confirmation_email_is_sent_to_the_reporter()
    {
        var data = ValidRepair();

        var repair = await CreateRepairAsync(data);

        var email = Assert.Single(Factory.EmailSender.SentEmails, e => e.ToEmail == data.ReporterEmail);
        Assert.Equal($"Przyjęto zgłoszenie naprawy nr {repair.Id}", email.Subject);
    }

    [Fact]
    public async Task Serial_number_line_is_left_out_when_there_is_no_serial_number()
    {
        var withSerial = ValidRepair();
        var withoutSerial = ValidRepair();
        withoutSerial.Product = "Meble";
        withoutSerial.SerialNumber = null;

        await CreateRepairAsync(withSerial);
        await CreateRepairAsync(withoutSerial);

        var emailWithSerial = Assert.Single(Factory.EmailSender.SentEmails, e => e.ToEmail == withSerial.ReporterEmail);
        var emailWithoutSerial = Assert.Single(Factory.EmailSender.SentEmails, e => e.ToEmail == withoutSerial.ReporterEmail);
        Assert.Contains($"Numer seryjny:</strong> {withSerial.SerialNumber}", emailWithSerial.HtmlBody);
        Assert.DoesNotContain("Numer seryjny", emailWithoutSerial.HtmlBody);
    }

    [Fact]
    public async Task Html_in_the_reporter_name_is_encoded_in_the_email()
    {
        // Anyone can report a repair, so the form could be used to put a fake link
        // into an email that comes from our own address.
        var data = ValidRepair();
        data.ReporterName = "<a href=\"https://evil.example\">Pay here</a>";

        await CreateRepairAsync(data);

        var email = Assert.Single(Factory.EmailSender.SentEmails, e => e.ToEmail == data.ReporterEmail);
        Assert.Contains("&lt;a href=&quot;https://evil.example&quot;&gt;Pay here&lt;/a&gt;", email.HtmlBody);
        Assert.DoesNotContain("<a href", email.HtmlBody);
    }
}
