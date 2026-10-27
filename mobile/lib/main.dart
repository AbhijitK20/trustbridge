import 'package:flutter/material.dart';

import 'api.dart';
import 'screens.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final api = await ApiClient.restore();
  runApp(TrustBridgeApp(api: api));
}

class TrustBridgeApp extends StatelessWidget {
  const TrustBridgeApp({super.key, required this.api});

  final ApiClient api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TrustBridge',
      debugShowCheckedModeBanner: false,
      theme: tbTheme(),
      home: api.isLoggedIn ? Shell(api: api) : LoginScreen(api: api),
    );
  }
}
