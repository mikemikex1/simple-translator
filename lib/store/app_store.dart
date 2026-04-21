import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

enum Language { zh, en, ja }

extension LanguageExt on Language {
  String get label => const {'zh': '中文', 'en': 'English', 'ja': '日本語'}[name]!;
  String get whisperCode => name;
}

class TranslationResult {
  final String original;
  final String translated;
  final Language fromLang;
  final Language toLang;
  final DateTime time;
  TranslationResult({
    required this.original,
    required this.translated,
    required this.fromLang,
    required this.toLang,
  }) : time = DateTime.now();
}

class AppStore extends ChangeNotifier {
  Language sourceLang = Language.zh;
  Language targetLang = Language.en;
  String apiKey = '';
  List<TranslationResult> messages = [];

  final _secure = const FlutterSecureStorage();

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final src = prefs.getString('sourceLang');
    final tgt = prefs.getString('targetLang');
    if (src != null) sourceLang = Language.values.byName(src);
    if (tgt != null) targetLang = Language.values.byName(tgt);
    apiKey = await _secure.read(key: 'openai_key') ?? '';
    notifyListeners();
  }

  Future<void> setLanguages(Language src, Language tgt) async {
    sourceLang = src;
    targetLang = tgt;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('sourceLang', src.name);
    await prefs.setString('targetLang', tgt.name);
    notifyListeners();
  }

  void swapLanguages() => setLanguages(targetLang, sourceLang);

  Future<void> saveApiKey(String key) async {
    apiKey = key;
    await _secure.write(key: 'openai_key', value: key);
    notifyListeners();
  }

  Future<void> clearApiKey() async {
    apiKey = '';
    await _secure.delete(key: 'openai_key');
    notifyListeners();
  }

  void addResult(TranslationResult r) {
    messages = [...messages, r];
    notifyListeners();
  }

  void clearMessages() {
    messages = [];
    notifyListeners();
  }
}
