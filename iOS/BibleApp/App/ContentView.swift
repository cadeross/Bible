import SwiftUI

struct ContentView: View {
    @State private var vm = ReadingViewModel()
    @State private var selectedTab: AppTab = .read

    enum AppTab: Hashable {
        case read, daily, library, search
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Read", systemImage: "book.pages", value: AppTab.read) {
                ReadingView(vm: vm)
            }
            Tab("Daily", systemImage: "sun.horizon", value: AppTab.daily) {
                DailyTab()
            }
            Tab("Library", systemImage: "books.vertical", value: AppTab.library) {
                LibraryTab()
            }
            Tab("Search", systemImage: "magnifyingglass", value: AppTab.search, role: .search) {
                ScriptureSearchView()
            }
        }
        .tabViewBottomAccessory(isEnabled: selectedTab == .read) {
            ReadingAccessoryBar(vm: vm)
        }
        .tabBarMinimizeBehavior(.onScrollDown)
    }
}
