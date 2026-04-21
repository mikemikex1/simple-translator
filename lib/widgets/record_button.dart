import 'package:flutter/material.dart';

class RecordButton extends StatelessWidget {
  final bool isRecording;
  final bool isBusy;
  final VoidCallback onPressStart;
  final VoidCallback onPressEnd;

  const RecordButton({
    super.key,
    required this.isRecording,
    required this.isBusy,
    required this.onPressStart,
    required this.onPressEnd,
  });

  @override
  Widget build(BuildContext context) {
    final Color color = isBusy
        ? Colors.grey
        : isRecording
            ? const Color(0xFFE53935)
            : const Color(0xFF3366FF);

    return GestureDetector(
      onTapDown: isBusy ? null : (_) => onPressStart(),
      onTapUp: isBusy ? null : (_) => onPressEnd(),
      onTapCancel: isBusy ? null : onPressEnd,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: isRecording ? 150 : 140,
        height: isRecording ? 150 : 140,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: isBusy
            ? const Center(child: CircularProgressIndicator(color: Colors.white))
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isRecording ? Icons.stop : Icons.mic,
                    color: Colors.white,
                    size: 42,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isRecording ? '放開翻譯' : '按住錄音',
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
      ),
    );
  }
}
