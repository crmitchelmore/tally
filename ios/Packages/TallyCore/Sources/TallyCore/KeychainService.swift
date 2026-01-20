import Foundation
import Security

/// Secure token storage using iOS Keychain
public final class KeychainService: @unchecked Sendable {
    public static let shared = KeychainService()
    
    private let service = "com.tally.app"
    private let tokenKey = "clerk_session_token"
    
    private init() {}
    
    /// Store the JWT token securely in Keychain
    public func storeToken(_ token: String) throws {
        let data = Data(token.utf8)
        
        // Delete existing item first
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey
        ]
        SecItemDelete(deleteQuery as CFDictionary)
        
        // Add new item
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unableToStore(status)
        }
    }
    
    /// Retrieve the stored JWT token from Keychain
    public func retrieveToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return token
    }
    
    /// Delete the stored token from Keychain
    public func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey
        ]
        SecItemDelete(query as CFDictionary)
    }
    
    /// Check if a token exists
    public var hasToken: Bool {
        retrieveToken() != nil
    }
}

public enum KeychainError: Error, LocalizedError {
    case unableToStore(OSStatus)
    case unableToRetrieve(OSStatus)
    
    public var errorDescription: String? {
        switch self {
        case .unableToStore(let status):
            return "Unable to store in Keychain: \(status)"
        case .unableToRetrieve(let status):
            return "Unable to retrieve from Keychain: \(status)"
        }
    }
}
