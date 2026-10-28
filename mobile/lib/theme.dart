import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class TB {
  static const ink = Color(0xFF14110D);
  static const cream = Color(0xFFF1EADD);
  static const paper = Color(0xFFFBF6EC);
  static const green = Color(0xFF233A30);
  static const lime = Color(0xFFE7D4A8);
  static const limeSoft = Color(0xFFF2E3BF);
  static const muted = Color(0xFF6E6A5E);
  static const line = Color(0xFFDDD5C5);
  static const blush = Color(0xFFF6E5DF);
  static const amber = Color(0xFFF4ECDA);
}

ThemeData tbTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: TB.green,
    brightness: Brightness.light,
  ).copyWith(
    surface: TB.paper,
    surfaceContainerHighest: TB.paper,
    primary: TB.green,
    secondary: TB.lime,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: TB.cream,
    fontFamily: 'sans-serif',
    appBarTheme: const AppBarTheme(
      backgroundColor: TB.cream,
      foregroundColor: TB.ink,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: TB.ink,
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
      ),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        color: TB.ink,
        fontSize: 40,
        fontWeight: FontWeight.w500,
        letterSpacing: -2.2,
        height: 0.98,
      ),
      headlineMedium: TextStyle(
        color: TB.ink,
        fontSize: 28,
        fontWeight: FontWeight.w500,
        letterSpacing: -1.2,
        height: 1.05,
      ),
      titleLarge: TextStyle(
        color: TB.ink,
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.7,
      ),
      titleMedium: TextStyle(
        color: TB.ink,
        fontSize: 15,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: TextStyle(color: TB.ink, fontSize: 14, height: 1.5),
      bodyMedium: TextStyle(color: TB.muted, fontSize: 12, height: 1.5),
      bodySmall: TextStyle(color: TB.muted, fontSize: 10, height: 1.4),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: TB.paper,
      labelStyle: const TextStyle(color: TB.muted, fontSize: 12),
      hintStyle: const TextStyle(color: Color(0xFF9A9383), fontSize: 13),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: TB.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: TB.green, width: 1.2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: TB.green,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: TB.green,
        side: const BorderSide(color: TB.line),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    ),
    dividerColor: TB.line,
    splashFactory: InkSparkle.splashFactory,
  );
}

TextStyle serifStyle(
  double size, {
  Color color = TB.ink,
  FontWeight weight = FontWeight.w500,
  double height = 1.0,
}) =>
    TextStyle(
      fontFamily: 'serif',
      fontSize: size,
      color: color,
      fontWeight: weight,
      fontStyle: FontStyle.italic,
      letterSpacing: -1.0,
      height: height,
    );

TextStyle monoStyle(double size, {Color color = TB.muted, double spacing = 0.8}) =>
    TextStyle(
      fontFamily: 'monospace',
      fontSize: size,
      color: color,
      letterSpacing: spacing,
    );

String money(int cents, String currency) {
  final symbol = currency.toLowerCase() == 'inr' ? '₹' : '\$';
  return NumberFormat.currency(
    locale: currency.toLowerCase() == 'inr' ? 'en_IN' : 'en_US',
    symbol: symbol,
    decimalDigits: 0,
  ).format(cents / 100);
}

String shortDate(String? value) {
  if (value == null) return 'Not set';
  final date = DateTime.tryParse(value);
  if (date == null) return 'Not set';
  return DateFormat('d MMM yyyy').format(date.toLocal());
}

String statusLabel(String status) =>
    status.replaceAll('_', ' ').toLowerCase();

Color statusColor(String status) {
  switch (status) {
    case 'RELEASED':
    case 'CONFIRMED':
      return TB.green;
    case 'DISPUTED':
      return const Color(0xFF984C40);
    case 'DELIVERED':
      return const Color(0xFF7A6636);
    case 'REFUNDED':
      return const Color(0xFF8D5B4D);
    default:
      return TB.green;
  }
}

Color outcomeColor(String? outcome) {
  switch (outcome) {
    case 'VERIFIED':
      return TB.green;
    case 'CONTRADICTED':
      return const Color(0xFF984C40);
    case 'VERIFIED_WITH_CONDITIONS':
      return const Color(0xFF7A6636);
    default:
      return const Color(0xFF7A6636);
  }
}

String outcomeLabel(String? outcome) =>
    (outcome ?? 'UNDETERMINED').replaceAll('_', ' ').toLowerCase();
