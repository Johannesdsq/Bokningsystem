using System.Globalization;

namespace WebApp;

public static class AvailabilityRoutes
{
    private static readonly string[] DefaultSlots =
    {
        "17:00",
        "18:00",
        "19:00",
        "20:00",
        "21:00",
        "22:00"
    };

    public static void Configure()
    {
        EnsureAclRule();
    }

    public static void Start()
    {
        App.MapGet("/api/availability", (HttpContext context) =>
        {
            var queryDate = context.Request.Query["date"].ToString();
            var parsed = DateTime.TryParseExact(
                queryDate,
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var dt
            );
            var date = parsed ? dt.ToString("yyyy-MM-dd") : DateTime.UtcNow.ToString("yyyy-MM-dd");

            var tables = SQLQuery(
                "SELECT id, tableNumber, seats, description FROM tables ORDER BY tableNumber"
            );

            var bookings = SQLQuery(
                @"SELECT id, tableId, bookingTime, status
                  FROM bookings
                  WHERE bookingDate = $date",
                new { date }
            );

            var activeBookings = bookings
                .Filter(x => ((string)x.status)?.ToLowerInvariant() == "booked")
                .Map(x => Obj(new
                {
                    id = x.id,
                    tableId = x.tableId,
                    bookingTime = x.bookingTime,
                    status = x.status
                }));

            var response = Obj(new
            {
                date,
                slots = Arr(DefaultSlots),
                tables,
                bookings = activeBookings
            });

            return (IResult)RestResult.Parse(context, response);
        });
    }

    private static void EnsureAclRule()
    {
        var existing = SQLQuery(
            "SELECT id FROM acl WHERE route = $route AND method = 'GET'",
            new { route = "/api/availability" }
        );

        if (existing.Length == 0)
        {
            SQLQuery(
                @"INSERT INTO acl(userRoles, method, allow, route, match, comment)
                  VALUES($userRoles, 'GET', 'allow', $route, 'true', $comment)",
                new
                {
                    userRoles = "visitor,user,admin",
                    route = "/api/availability",
                    comment = "Allow availability endpoint"
                }
            );
        }
    }
}
