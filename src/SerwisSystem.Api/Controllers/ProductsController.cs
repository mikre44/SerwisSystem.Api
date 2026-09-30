using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SerwisSystem.Api.Models.DTOs;
using SerwisSystem.Api.Services;

namespace SerwisSystem.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // GET api/products
    // Used by the customer form and the staff edit form.
    [HttpGet]
    public ActionResult<List<ProductResponseDto>> GetProducts()
    {
        return ProductCatalog.GetProducts();
    }
}
