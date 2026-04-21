import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../store/app_store.dart';
import '../services/speech_service.dart';
import '../services/translate_service.dart';
import '../widgets/record_button.dart';

class VoiceScreen extends StatefulWidget {
  const VoiceScreen({super.key});

  @override
  State<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> {
  final _recorder = AudioRecorder();
  bool _isRecording = false;
  bool _isBusy = false;
  String? _error;
  final List<({String original, String translated})> _results = [];

  Future<void> _startRecording() async {
    final status = await Permission.microphone.request();
    if (!status.isGranted) {
      setState(() => _error = '需要麥克風權限');
      return;
    }
    final dir = await getTemporaryDirectory();
    final path = '${dir.path}/rec_${DateTime.now().millisecondsSinceEpoch}.m4a';
    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc, sampleRate: 16000, numChannels: 1),
      path: path,
    );
    setState(() { _isRecording = true; _error = null; });
  }

  Future<void> _stopRecording() async {
    final path = await _recorder.stop();
    setState(() { _isRecording = false; _isBusy = true; });

    final store = context.read<AppStore>();
    if (store.apiKey.isEmpty) {
      setState(() { _isBusy = false; _error = '請先到設定頁填入 API Key'; });
      return;
    }
    if (path == null) {
      setState(() { _isBusy = false; _error = '錄音失敗'; });
      return;
    }

    try {
      final text = await transcribeAudio(
        audioPath: path,
        language: store.sourceLang,
        apiKey: store.apiKey,
      );
      if (text.isEmpty) {
        setState(() { _isBusy = false; _error = '未能辨識語音'; });
        return;
      }
      final translated = await translateText(
        text: text,
        from: store.sourceLang,
        to: store.targetLang,
        apiKey: store.apiKey,
      );
      setState(() {
        _results.insert(0, (original: text, translated: translated));
        _error = null;
      });
      await File(path).delete().catchError((_) => File(path));
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isBusy = false);
    }
  }

  @override
  void dispose() {
    _recorder.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: Colors.white,
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 36),
          child: Column(
            children: [
              RecordButton(
                isRecording: _isRecording,
                isBusy: _isBusy,
                onPressStart: _startRecording,
                onPressEnd: _stopRecording,
              ),
              const SizedBox(height: 16),
              const Text('按住錄音，放開自動翻譯',
                  style: TextStyle(color: Colors.grey, fontSize: 13)),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ],
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: _results.isEmpty
              ? const Center(
                  child: Text('翻譯結果會顯示在這裡',
                      style: TextStyle(color: Colors.grey, fontSize: 14)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _results.length,
                  itemBuilder: (_, i) {
                    final r = _results[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(r.original,
                                style: const TextStyle(fontSize: 15, color: Color(0xFF555555))),
                            const SizedBox(height: 6),
                            Text(r.translated,
                                style: const TextStyle(
                                    fontSize: 17,
                                    color: Color(0xFF3366FF),
                                    fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
