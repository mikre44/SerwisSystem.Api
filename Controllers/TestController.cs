using Microsoft.AspNetCore.Mvc;

namespace SerwisSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            message = "API działa!",
            serverTime = DateTime.Now
        });
    }
}