package com.example.app.web;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class MeController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@org.springframework.web.bind.annotation.RequestHeader HttpHeaders headers) {
        try {
            String auth = headers.getFirst(HttpHeaders.AUTHORIZATION);
            if (auth == null || !auth.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "missing bearer token"));
            }
            String idToken = auth.substring(7);
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            return ResponseEntity.ok(Map.of(
                    "uid", decoded.getUid(),
                    "claims", decoded.getClaims()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
    }
}

