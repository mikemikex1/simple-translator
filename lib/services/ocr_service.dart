import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

Future<String> extractTextFromImage({
  required File imageFile,
  required String googleApiKey,
}) async {
  final bytes = await imageFile.readAsBytes();
  final base64Image = base64Encode(bytes);

  final response = await http.post(
    Uri.parse('https://vision.googleapis.com/v1/images:annotate?key=$googleApiKey'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'requests': [
        {
          'image': {'content': base64Image},
          'features': [{'type': 'TEXT_DETECTION', 'maxResults': 1}],
        }
      ],
    }),
  );

  if (response.statusCode != 200) {
    throw Exception('Vision API error ${response.statusCode}');
  }

  final data = jsonDecode(response.body);
  return (data['responses']?[0]?['fullTextAnnotation']?['text'] as String? ?? '').trim();
}
