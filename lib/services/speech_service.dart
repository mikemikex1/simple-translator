import 'dart:convert';
import 'package:http/http.dart' as http;
import '../store/app_store.dart';

Future<String> transcribeAudio({
  required String audioPath,
  required Language language,
  required String apiKey,
}) async {
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('https://api.openai.com/v1/audio/transcriptions'),
  );
  request.headers['Authorization'] = 'Bearer $apiKey';
  request.files.add(await http.MultipartFile.fromPath('file', audioPath));
  request.fields['model'] = 'whisper-1';
  request.fields['language'] = language.whisperCode;

  final streamed = await request.send();
  final body = await streamed.stream.bytesToString();

  if (streamed.statusCode != 200) {
    final err = jsonDecode(body);
    throw Exception(err['error']?['message'] ?? 'Whisper error ${streamed.statusCode}');
  }

  final data = jsonDecode(body);
  return (data['text'] as String).trim();
}
