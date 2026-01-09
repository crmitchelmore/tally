import Foundation
import Security

enum KeychainService {
  enum KeychainError: Error {
    case unexpectedStatus(OSStatus)
  }

  private static let service = "tally-ios"

  static func readString(key: String) -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)

    if status == errSecItemNotFound {
      return nil
    }

    guard status == errSecSuccess else {
      return nil
    }

    guard let data = item as? Data else {
      return nil
    }

    return String(data: data, encoding: .utf8)
  }

  static func writeString(_ value: String, key: String) throws {
    let data = Data(value.utf8)

    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
    ]

    let update: [String: Any] = [
      kSecValueData as String: data,
    ]

    let status = SecItemUpdate(query as CFDictionary, update as CFDictionary)
    if status == errSecSuccess {
      return
    }

    if status == errSecItemNotFound {
      let add: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: key,
        kSecValueData as String: data,
      ]

      let addStatus = SecItemAdd(add as CFDictionary, nil)
      guard addStatus == errSecSuccess else { throw KeychainError.unexpectedStatus(addStatus) }
      return
    }

    throw KeychainError.unexpectedStatus(status)
  }

  static func delete(key: String) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
    ]

    SecItemDelete(query as CFDictionary)
  }
}
