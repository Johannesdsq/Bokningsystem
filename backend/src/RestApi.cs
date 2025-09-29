namespace WebApp;
public static class RestApi
{
    private static bool IsBookingsTable(string table)
    {
        return string.Equals(table, "bookings", StringComparison.OrdinalIgnoreCase);
    }

    private static dynamic GetSessionUser(HttpContext context)
    {
        return Session.Get(context, "user");
    }

    private static bool IsAdmin(dynamic user)
    {
        return user != null && user.role == "admin";
    }

    private static int ToInt(object value)
    {
        return value == null ? 0 : Convert.ToInt32(value, CultureInfo.InvariantCulture);
    }

    private static dynamic RequireLogin(HttpContext context)
    {
        context.Response.StatusCode = 403;
        return RestResult.Parse(context, new { error = "Login required." });
    }

    private static dynamic Forbid(HttpContext context)
    {
        context.Response.StatusCode = 403;
        return RestResult.Parse(context, new { error = "Not allowed." });
    }

    public static void Start()
    {
        App.MapPost("/api/{table}", (
            HttpContext context, string table, JsonElement bodyJson
        ) =>
        {
            var body = JSON.Parse(bodyJson.ToString());
            body.Delete("id");

            var isBookings = IsBookingsTable(table);
            if (isBookings)
            {
                var user = GetSessionUser(context);
                var isAdmin = IsAdmin(user);
                var providedUserId = body.HasKey("userId") ? body.userId : null;
                body.Delete("userId");
                if (!isAdmin && user == null)
                {
                    return RequireLogin(context);
                }
                var targetUserId = isAdmin && providedUserId != null ? providedUserId : user.id;
                body.userId = targetUserId;
                if (!body.HasKey("status") || string.IsNullOrWhiteSpace((string)body.status))
                {
                    body.status = "booked";
                }
            }

            var parsed = ReqBodyParse(table, body);
            var columns = parsed.insertColumns;
            var values = parsed.insertValues;
            var sql = $"INSERT INTO {table}({columns}) VALUES({values})";
            var result = SQLQueryOne(sql, parsed.body, context);
            if (!result.HasKey("error"))
            {
                // Get the insert id and add to our result
                result.insertId = SQLQueryOne(
                    @$"SELECT id AS __insertId 
                       FROM {table} ORDER BY id DESC LIMIT 1"
                ).__insertId;
            }
            return RestResult.Parse(context, result);
        });

        App.MapGet("/api/{table}", (
            HttpContext context, string table
        ) =>
        {
            var baseSql = $"SELECT * FROM {table}";
            var query = RestQuery.Parse(context.Request.Query);
            if (IsBookingsTable(table))
            {
                var user = GetSessionUser(context);
                var isAdmin = IsAdmin(user);
                if (!isAdmin)
                {
                    if (user == null)
                    {
                        return RequireLogin(context);
                    }
                    var clause = "userId = $userId";
                    string qSql = query.sql;
                    if (qSql.Contains("WHERE", StringComparison.OrdinalIgnoreCase))
                    {
                        qSql += " AND " + clause;
                    }
                    else
                    {
                        qSql += " WHERE " + clause;
                    }
                    query.sql = qSql;
                    query.parameters.userId = user.id;
                }
            }
            var sql = baseSql + query.sql;
            return RestResult.Parse(context, SQLQuery(sql, query.parameters, context));
        });

        App.MapGet("/api/{table}/{id}", (
            HttpContext context, string table, string id
        ) =>
        {
            var parameters = ReqBodyParse(table, Obj(new { id })).body;
            var result = SQLQueryOne(
                $"SELECT * FROM {table} WHERE id = $id",
                parameters,
                context
            );
            if (!IsBookingsTable(table))
            {
                return RestResult.Parse(context, result);
            }

            if (result == null || (result.HasKey("error") && result.error != null))
            {
                return RestResult.Parse(context, result);
            }

            var user = GetSessionUser(context);
            var isAdmin = IsAdmin(user);
            if (!isAdmin)
            {
                if (user == null)
                {
                    return RequireLogin(context);
                }
                if (ToInt(result.userId) != ToInt(user.id))
                {
                    return Forbid(context);
                }
            }
            return RestResult.Parse(context, result);
        });

        App.MapPut("/api/{table}/{id}", (
            HttpContext context, string table, string id, JsonElement bodyJson
        ) =>
        {
            var body = JSON.Parse(bodyJson.ToString());
            body.id = id;

            dynamic existing = null;
            if (IsBookingsTable(table))
            {
                var user = GetSessionUser(context);
                var isAdmin = IsAdmin(user);
                var providedUserId = body.HasKey("userId") ? body.userId : null;
                body.Delete("userId");
                if (!isAdmin && user == null)
                {
                    return RequireLogin(context);
                }
                var selectParams = ReqBodyParse(table, Obj(new { id })).body;
                existing = SQLQueryOne(
                    $"SELECT * FROM {table} WHERE id = $id",
                    selectParams,
                    context
                );
                if (existing == null || (existing.HasKey("error") && existing.error != null))
                {
                    return RestResult.Parse(context, existing);
                }
                if (!isAdmin && ToInt(existing.userId) != ToInt(user.id))
                {
                    return Forbid(context);
                }
                var targetUserId = isAdmin && providedUserId != null ? providedUserId : (isAdmin ? existing.userId : user.id);
                body.userId = targetUserId;
            }

            var parsed = ReqBodyParse(table, body);
            var update = parsed.update;
            var sql = $"UPDATE {table} SET {update} WHERE id = $id";
            var result = SQLQueryOne(sql, parsed.body, context);
            return RestResult.Parse(context, result);
        });

        App.MapDelete("/api/{table}/{id}", (
             HttpContext context, string table, string id
        ) =>
        {
            var parameters = ReqBodyParse(table, Obj(new { id })).body;
            if (IsBookingsTable(table))
            {
                var booking = SQLQueryOne(
                    $"SELECT * FROM {table} WHERE id = $id",
                    parameters,
                    context
                );
                if (booking == null || (booking.HasKey("error") && booking.error != null))
                {
                    return RestResult.Parse(context, booking);
                }

                var user = GetSessionUser(context);
                var isAdmin = IsAdmin(user);
                if (!isAdmin)
                {
                    if (user == null)
                    {
                        return RequireLogin(context);
                    }
                    if (ToInt(booking.userId) != ToInt(user.id))
                    {
                        return Forbid(context);
                    }
                }
            }
            return RestResult.Parse(context, SQLQueryOne(
                $"DELETE FROM {table} WHERE id = $id",
                parameters,
                context
            ));
        });
    }
}
