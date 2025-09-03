# Authentication Troubleshooting Guide

## Issues Found and Fixed

### 1. Password Mismatch ✅ FIXED
- **Problem**: DataInitializer was creating users with passwords "admin" and "user"
- **Solution**: Updated to use "password" for both users to match login form

### 2. Database Configuration ✅ FIXED
- **Problem**: MySQL connection issues
- **Solution**: Switched to H2 in-memory database for testing

### 3. Code Issues ✅ FIXED
- **Problem**: Commented password encoding in UserServiceImpl
- **Solution**: Uncommented password encoding lines

## Current Status

The application should now work with the following credentials:

### Demo Users:
- **Admin**: admin@gmail.com / password
- **User**: user@gmail.com / password

## To Run the Application:

1. **Ensure Java 17 is installed**:
   ```bash
   java -version
   ```
   Should show Java 17.x.x

2. **Run the application**:
   ```bash
   ./mvnw spring-boot:run
   ```
   or
   ```bash
   mvnw.cmd spring-boot:run
   ```

3. **Access the application**:
   - Open browser: http://localhost:8080
   - Login page: http://localhost:8080/login

## Debug Information

The application includes debug logging that will show:
- User creation process
- Authentication attempts
- User details during login

## H2 Database Console

If using H2 database, you can access the database console at:
- http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:mem:testdb
- Username: sa
- Password: password

## Expected Behavior

1. **First Run**: Users will be automatically created with roles
2. **Login**: Use the demo credentials above
3. **Redirect**: 
   - Admin users → /admin/dashboard
   - Regular users → /user/dashboard

## If Still Having Issues

1. Check the console output for debug information
2. Verify Java version is 17
3. Ensure no other applications are using port 8080
4. Check firewall settings if using MySQL
