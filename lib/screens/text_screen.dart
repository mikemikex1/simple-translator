import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../store/app_store.dart';
import '../services/translate_service.dart';
import '../widgets/chat_bubble.dart';

class TextScreen extends StatefulWidget {
  const TextScreen({super.key});

  @override
  State<TextScreen> createState() => _TextScreenState();
}

class _TextScreenState extends State<TextScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final store = context.read<AppStore>();
    if (store.apiKey.isEmpty) {
      setState(() => _error = '請先到設定頁填入 OpenAI API Key');
      return;
    }
    setState(() { _loading = true; _error = null; });
    _controller.clear();
    try {
      final translated = await translateText(
        text: text,
        from: store.sourceLang,
        to: store.targetLang,
        apiKey: store.apiKey,
      );
      store.addResult(TranslationResult(
        original: text,
        translated: translated,
        fromLang: store.sourceLang,
        toLang: store.targetLang,
      ));
      await Future.delayed(const Duration(milliseconds: 100));
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = context.watch<AppStore>().messages;
    return Column(
      children: [
        Expanded(
          child: messages.isEmpty
              ? const Center(
                  child: Text('輸入文字並按翻譯',
                      style: TextStyle(color: Colors.grey, fontSize: 15)))
              : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  itemCount: messages.length,
                  itemBuilder: (_, i) => ChatBubble(result: messages[i]),
                ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
          ),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE0E0E0))),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  minLines: 1,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: '輸入文字...',
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFFDDDDDD)),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFFAFAFA),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3366FF),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _loading
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('翻譯', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
        if (messages.isNotEmpty)
          TextButton(
            onPressed: context.read<AppStore>().clearMessages,
            child: const Text('清除記錄', style: TextStyle(color: Colors.grey, fontSize: 12)),
          ),
      ],
    );
  }
}
