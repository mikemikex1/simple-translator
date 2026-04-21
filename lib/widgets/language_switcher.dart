import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../store/app_store.dart';

class LanguageSwitcher extends StatelessWidget {
  const LanguageSwitcher({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final langs = Language.values;

    Language nextLang(Language current, Language exclude) {
      final candidates = langs.where((l) => l != exclude).toList();
      final idx = candidates.indexOf(current);
      return candidates[(idx + 1) % candidates.length];
    }

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: _LangButton(
              label: store.sourceLang.label,
              onTap: () => store.setLanguages(
                nextLang(store.sourceLang, store.targetLang),
                store.targetLang,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.swap_horiz, color: Colors.grey),
            onPressed: store.swapLanguages,
          ),
          Expanded(
            child: _LangButton(
              label: store.targetLang.label,
              onTap: () => store.setLanguages(
                store.sourceLang,
                nextLang(store.targetLang, store.sourceLang),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LangButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _LangButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFEEF2FF),
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: const TextStyle(
            color: Color(0xFF3366FF),
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
    );
  }
}
