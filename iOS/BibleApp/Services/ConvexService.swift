import Foundation

// MARK: - Convex HTTP Service
//
// HTTP client for the shared Convex backend at quixotic-wolf-423.convex.cloud.
// Queries:   POST /api/query   { path, args }
// Mutations: POST /api/mutation { path, args }
// Both carry an optional Clerk JWT in the Authorization header for user-scoped data.
//
// Response format: { "status": "success" | "error", "value": ..., "errorMessage": ... }

actor ConvexService {
    static let shared = ConvexService()

    // The deployment URL shared with the web app
    private let baseURL = "https://quixotic-wolf-423.convex.cloud"

    // MARK: Highlights

    func listHighlights(book: String, chapter: Int, token: String?) async throws -> [Highlight] {
        let args: [String: Any] = ["book": book, "chapter": chapter]
        let value = try await query(path: "highlights:listForChapter", args: args, token: token)
        // Convex returns an array; decode it
        let arrayData = try JSONSerialization.data(withJSONObject: value)
        return try JSONDecoder().decode([ConvexHighlight].self, from: arrayData).map(\.toHighlight)
    }

    func saveHighlight(_ highlight: Highlight, token: String?) async throws {
        let args: [String: Any] = [
            "book":    highlight.book,
            "chapter": highlight.chapter,
            "verse":   highlight.verse,
            "color":   highlight.color.rawValue,
            "content": highlight.note ?? "",
            "note":    highlight.note as Any,
        ]
        try await mutation(path: "highlights:save", args: args, token: token)
    }

    func removeHighlight(book: String, chapter: Int, verse: Int, token: String?) async throws {
        let args: [String: Any] = ["book": book, "chapter": chapter, "verse": verse]
        try await mutation(path: "highlights:remove", args: args, token: token)
    }

    // MARK: Reading Position

    func updateLastRead(book: String, chapter: Int, token: String?) async throws {
        let args: [String: Any] = ["book": book, "chapter": chapter]
        try await mutation(path: "profiles:updateLastRead", args: args, token: token)
    }

    // MARK: Reading History

    func saveReadingHistory(book: String, chapter: Int, wordsRead: Int, duration: Int, token: String?) async throws {
        let args: [String: Any] = [
            "book":            book,
            "chapter":         chapter,
            "wordsRead":       wordsRead,
            "durationSeconds": duration,
        ]
        try await mutation(path: "history:save", args: args, token: token)
    }

    // MARK: HTTP Helpers

    /// POST /api/query — returns the unwrapped `value` field as Any
    private func query(path: String, args: [String: Any], token: String?) async throws -> Any {
        let url = URL(string: "\(baseURL)/api/query")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        request.httpBody = try JSONSerialization.data(withJSONObject: ["path": path, "args": args])

        let (data, _) = try await URLSession.shared.data(for: request)
        return try unwrapResponse(data)
    }

    /// POST /api/mutation — returns the unwrapped `value` field as Any (discardable)
    @discardableResult
    private func mutation(path: String, args: [String: Any], token: String?) async throws -> Any {
        let url = URL(string: "\(baseURL)/api/mutation")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        request.httpBody = try JSONSerialization.data(withJSONObject: ["path": path, "args": args])

        let (data, _) = try await URLSession.shared.data(for: request)
        return try unwrapResponse(data)
    }

    /// Parse `{ "status": "success"/"error", "value": ..., "errorMessage": ... }`
    private func unwrapResponse(_ data: Data) throws -> Any {
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw ConvexError.invalidResponse
        }
        if let errorMsg = json["errorMessage"] as? String {
            throw ConvexError.serverError(errorMsg)
        }
        guard let value = json["value"] else {
            // Mutations often return the ID or null — treat missing value as null/empty
            return NSNull()
        }
        return value
    }
}

// MARK: - Errors

enum ConvexError: Error, LocalizedError {
    case invalidResponse
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:    return "Invalid response from Convex"
        case .serverError(let m): return "Convex error: \(m)"
        }
    }
}

// MARK: - Response Shape

private struct ConvexHighlight: Decodable {
    let book: String
    let chapter: Int
    let verse: Int
    let color: String
    let note: String?
    let createdAt: Double?

    var toHighlight: Highlight {
        Highlight(
            book: book,
            chapter: chapter,
            verse: verse,
            color: HighlightColor(rawValue: color) ?? .yellow,
            note: note,
            createdAt: createdAt.map { Date(timeIntervalSince1970: $0 / 1000) } ?? .now
        )
    }
}
