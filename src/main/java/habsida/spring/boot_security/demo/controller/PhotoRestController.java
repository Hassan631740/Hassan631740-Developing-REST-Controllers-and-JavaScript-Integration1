package habsida.spring.boot_security.demo.controller;

import habsida.spring.boot_security.demo.dto.ApiResponse;
import habsida.spring.boot_security.demo.model.User;
import habsida.spring.boot_security.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Optional;

@RestController
@RequestMapping("/api/photo")
@CrossOrigin(origins = "*")
public class PhotoRestController {


    private final UserService userService;
    public PhotoRestController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadPhoto(
            @RequestParam("photo") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Please select a file to upload"));
            }

            // Check file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Only image files are allowed"));
            }

            // Check file size (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File size must be less than 5MB"));
            }

            // Convert to byte array and save to database
            byte[] photoBytes = file.getBytes();
            userService.updateUserPhoto(userDetails.getUsername(), photoBytes, contentType);

            return ResponseEntity.ok(ApiResponse.success("Photo uploaded successfully", "Photo saved to database"));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to upload photo: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error uploading photo: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<byte[]> getUserPhoto(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userService.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getPhoto() != null && user.getPhoto().length > 0) {
                    HttpHeaders headers = new HttpHeaders();
                    String contentType = user.getPhotoContentType();
                    if (contentType != null && !contentType.trim().isEmpty()) {
                        headers.setContentType(MediaType.parseMediaType(contentType));
                    } else {
                        // Default to image/jpeg if content type is not set
                        headers.setContentType(MediaType.IMAGE_JPEG);
                    }
                    return new ResponseEntity<>(user.getPhoto(), headers, HttpStatus.OK);
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/current")
    public ResponseEntity<byte[]> getCurrentUserPhoto(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Optional<User> userOpt = userService.findByEmail(userDetails.getUsername());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getPhoto() != null && user.getPhoto().length > 0) {
                    HttpHeaders headers = new HttpHeaders();
                    String contentType = user.getPhotoContentType();
                    if (contentType != null && !contentType.trim().isEmpty()) {
                        headers.setContentType(MediaType.parseMediaType(contentType));
                    } else {
                        // Default to image/jpeg if content type is not set
                        headers.setContentType(MediaType.IMAGE_JPEG);
                    }
                    return new ResponseEntity<>(user.getPhoto(), headers, HttpStatus.OK);
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/current/base64")
    public ResponseEntity<ApiResponse<String>> getCurrentUserPhotoBase64(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Optional<User> userOpt = userService.findByEmail(userDetails.getUsername());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getPhoto() != null && user.getPhoto().length > 0) {
                    String base64Photo = Base64.getEncoder().encodeToString(user.getPhoto());
                    String contentType = user.getPhotoContentType();
                    if (contentType == null || contentType.trim().isEmpty()) {
                        contentType = "image/jpeg"; // Default content type
                    }
                    String dataUrl = "data:" + contentType + ";base64," + base64Photo;
                    return ResponseEntity.ok(ApiResponse.success("Photo retrieved successfully", dataUrl));
                }
            }
            return ResponseEntity.ok(ApiResponse.success("No photo found", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving photo: " + e.getMessage()));
        }
    }

    @DeleteMapping("/current")
    public ResponseEntity<ApiResponse<String>> deleteCurrentUserPhoto(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            userService.updateUserPhoto(userDetails.getUsername(), null, null);
            return ResponseEntity.ok(ApiResponse.success("Photo deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error deleting photo: " + e.getMessage()));
        }
    }
}
