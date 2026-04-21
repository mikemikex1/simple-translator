import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'store/app_store.dart';
import 'widgets/language_switcher.dart';
import 'screens/text_screen.dart';
import 'screens/voice_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/settings_screen.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppStore()..load(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SimpleTranslator',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF3366FF)),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF5F5F5),
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _pageController = PageController(initialPage: 1);
  int _currentPage = 1;

  static const _tabs = [
    (label: '文字', icon: Icons.text_fields),
    (label: '語音', icon: Icons.mic),
    (label: '相機', icon: Icons.camera_alt),
    (label: '設定', icon: Icons.settings),
  ];

  static const _pages = [
    TextScreen(),
    VoiceScreen(),
    CameraScreen(),
    SettingsScreen(),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showLangSwitcher = _currentPage != 3;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            if (showLangSwitcher) const LanguageSwitcher(),
            if (showLangSwitcher)
              const Divider(height: 1, color: Color(0xFFE0E0E0)),
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (i) => setState(() => _currentPage = i),
                children: _pages,
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentPage,
        onTap: (i) {
          _pageController.animateToPage(
            i,
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
          );
          setState(() => _currentPage = i);
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF3366FF),
        unselectedItemColor: Colors.grey,
        items: _tabs
            .map((t) => BottomNavigationBarItem(icon: Icon(t.icon), label: t.label))
            .toList(),
      ),
    );
  }
}
