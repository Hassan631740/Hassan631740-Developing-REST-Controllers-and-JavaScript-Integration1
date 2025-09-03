# Fix for "detached entity passed to persist" Error

## Problem Description
The application was failing with the error:
```
org.springframework.dao.InvalidDataAccessApiUsageException: detached entity passed to persist: habsida.spring.boot_security.demo.model.Role
```

## Root Cause
The issue was in the `User` entity's `@ManyToMany` relationship with `Role` that included `CascadeType.PERSIST`. When the `DataInitializer` tried to create users and assign existing roles, Spring attempted to persist already-existing role entities, causing the detached entity error.

## Solution Applied

### 1. Modified User.java
**Before:**
```java
@ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
```

**After:**
```java
@ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.MERGE})
```

### 2. Enhanced DataInitializer.java
Added better structure and comments for role assignment.

## How to Verify the Fix

1. **Run the application** using Maven:
   ```bash
   mvn spring-boot:run
   ```

2. **Check the logs** - you should see:
   - No detached entity errors
   - Successful creation of roles and users
   - Application starting successfully

3. **Test the endpoints**:
   - Visit `http://localhost:8080` to see the application running
   - Check that users and roles are properly created

## Technical Explanation

- **CascadeType.MERGE**: Allows Spring to merge detached entities (existing roles) with the persistence context
- **CascadeType.PERSIST**: Was causing the issue by trying to persist already-existing entities
- **The fix**: Removes the problematic PERSIST cascade, keeping only MERGE for proper handling of existing entities

## Expected Behavior After Fix

1. Application starts without errors
2. Roles (USER, ADMIN) are created successfully
3. Users (admin, user) are created with proper role assignments
4. No detached entity exceptions in the logs 