import 'dart:convert';
import 'package:http/http.dart' as http;
import '../store/app_store.dart';

const _langNames = {
  Language.zh: 'Traditional Chinese',
  Language.en: 'English',
  Language.ja: 'Japanese',
};

Future<String> translateText({
  required String text,
  required Language from,
  required Language to,
  required String apiKey,
}) async {
  final response = await http.post(
    Uri.parse('https://api.openai.com/v1/chat/completions'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $apiKey',
    },
    body: jsonEncode({
      'model': 'gpt-4o-mini',
      'temperature': 0.3,
      'messages': [
        {
          'role': 'system',
          'content':
              'You are a translator. Translate from ${_langNames[from]} to ${_langNames[to]}. Output only the translated text.',
        },
        {'role': 'user', 'content': text},
      ],
    }),
  );

  if (response.statusCode != 200) {
    final err = jsonDecode(response.body);
    throw Exception(err['error']?['message'] ?? 'API error ${response.statusCode}');
  }

  final data = jsonDecode(response.body);
  return data['choices'][0]['message']['content'].toString().trim();
}
