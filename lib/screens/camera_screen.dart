import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../store/app_store.dart';
import '../services/ocr_service.dart';
import '../services/translate_service.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  final _picker = ImagePicker();
  File? _image;
  String _extracted = '';
  String _translated = '';
  bool _loading = false;
  String? _error;

  Future<void> _pick(ImageSource source) async {
    setState(() { _error = null; _extracted = ''; _translated = ''; });
    final xfile = await _picker.pickImage(source: source, imageQuality: 85);
    if (xfile == null) return;
    setState(() { _image = File(xfile.path); _loading = true; });

    final store = context.read<AppStore>();
    if (store.apiKey.isEmpty) {
      setState(() { _loading = false; _error = '請先到設定頁填入 API Key'; });
      return;
    }

    try {
      final text = await extractTextFromImage(
        imageFile: _image!,
        googleApiKey: store.apiKey,
      );
      if (text.isEmpty) {
        setState(() { _loading = false; _error = '未能辨識文字'; });
        return;
      }
      setState(() => _extracted = text);
      final translated = await translateText(
        text: text,
        from: store.sourceLang,
        to: store.targetLang,
        apiKey: store.apiKey,
      );
      setState(() { _translated = translated; _error = null; });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : () => _pick(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('拍照'),
                  style: _btnStyle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : () => _pick(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text('選圖庫'),
                  style: _btnStyle,
                ),
              ),
            ],
          ),
          if (_image != null) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.file(_image!, height: 220, fit: BoxFit.cover),
            ),
          ],
          if (_loading) ...[
            const SizedBox(height: 24),
            const Center(child: CircularProgressIndicator()),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13),
                textAlign: TextAlign.center),
          ],
          if (_extracted.isNotEmpty) ...[
            const SizedBox(height: 16),
            _ResultCard(label: '辨識文字', text: _extracted, color: const Color(0xFFF7F7F7)),
          ],
          if (_translated.isNotEmpty) ...[
            const SizedBox(height: 12),
            _ResultCard(
                label: '翻譯結果',
                text: _translated,
                color: const Color(0xFFEEF2FF),
                textColor: const Color(0xFF3366FF)),
          ],
          if (_image == null && !_loading)
            const Padding(
              padding: EdgeInsets.only(top: 48),
              child: Text('拍照或選擇圖片以辨識文字',
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                  textAlign: TextAlign.center),
            ),
        ],
      ),
    );
  }

  static final _btnStyle = ElevatedButton.styleFrom(
    backgroundColor: const Color(0xFF3366FF),
    foregroundColor: Colors.white,
    padding: const EdgeInsets.symmetric(vertical: 14),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  );
}

class _ResultCard extends StatelessWidget {
  final String label;
  final String text;
  final Color color;
  final Color textColor;

  const _ResultCard({
    required this.label,
    required this.text,
    required this.color,
    this.textColor = const Color(0xFF333333),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 6)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          const SizedBox(height: 4),
          Text(text,
              style: TextStyle(fontSize: 15, color: textColor, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
