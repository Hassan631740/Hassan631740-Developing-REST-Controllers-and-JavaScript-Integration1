package habsida.spring.boot_security.demo.configs;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, 
                                       HttpServletResponse response, 
                                       AuthenticationException exception) 
            throws IOException, ServletException {
        
        String errorMessage = "Invalid username or password.";
        
        if (exception instanceof DisabledException) {
            errorMessage = "Your account has been disabled. Please contact your administrator for assistance.";
        } else if (exception.getMessage() != null && exception.getMessage().contains("disabled")) {
            errorMessage = "Your account has been disabled. Please contact your administrator for assistance.";
        }
        
        // Add error message to session
        request.getSession().setAttribute("loginError", errorMessage);
        
        // Redirect to login page with error
        response.sendRedirect("/login?error");
    }
}
