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
        EnsureTimeSlotsSetup();
        EnsureMenuAcl();
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

            // Read slots from DB (fallback to default if none configured)
            var slotRows = SQLQuery("SELECT time FROM time_slots ORDER BY time");
            var slotsFromDb = slotRows.Map(x => (string)x.time);
            var slots = slotsFromDb.Length > 0 ? slotsFromDb : Arr(DefaultSlots);

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
                slots,
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

    private static void EnsureTimeSlotsSetup()
    {
        // Create table if it doesn't exist
        SQLQuery(
            @"CREATE TABLE IF NOT EXISTS time_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL,
                time TEXT UNIQUE NOT NULL
            )"
        );

        // Seed defaults if empty
        var countRow = SQLQueryOne("SELECT COUNT(*) AS c FROM time_slots");
        var count = Convert.ToInt32(countRow.c, CultureInfo.InvariantCulture);
        if (count == 0)
        {
            foreach (var t in DefaultSlots)
            {
                SQLQuery("INSERT OR IGNORE INTO time_slots(time) VALUES($time)", new { time = t });
            }
        }

        // Ensure ACL rules for /api/time_slots
        EnsureAcl("visitor,user,admin", "GET", "/api/time_slots", "Allow everyone to read time slots");
        EnsureAcl("admin", "POST", "/api/time_slots", "Allow admin to POST time slots");
        EnsureAcl("admin", "PUT", "/api/time_slots", "Allow admin to PUT time slots");
        EnsureAcl("admin", "DELETE", "/api/time_slots", "Allow admin to DELETE time slots");
    }

    private static void EnsureAcl(string roles, string method, string route, string comment)
    {
        var existing = SQLQuery(
            "SELECT id FROM acl WHERE route = $route AND method = $method",
            new { route, method }
        );
        if (existing.Length == 0)
        {
            SQLQuery(
                @"INSERT INTO acl(userRoles, method, allow, route, match, comment)
                  VALUES($userRoles, $method, 'allow', $route, 'true', $comment)",
                new { userRoles = roles, method, route, comment }
            );
        }
    }

    private static void EnsureMenuAcl()
    {
        // Allow reading menu items to all, write access only to admin
        EnsureAcl("visitor,user,admin", "GET", "/api/menu_items", "Allow everyone to read menu items");
        EnsureAcl("admin", "POST", "/api/menu_items", "Allow admin to POST menu items");
        EnsureAcl("admin", "PUT", "/api/menu_items", "Allow admin to PUT menu items");
        EnsureAcl("admin", "DELETE", "/api/menu_items", "Allow admin to DELETE menu items");
    }
}
