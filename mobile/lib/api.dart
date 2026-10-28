import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  ApiException(this.status, this.message, [this.data]);

  final int status;
  final String message;
  final Map<String, dynamic>? data;

  @override
  String toString() => message;
}

class ApiClient {
  static const String baseUrl = 'https://trustbridge-abhithe.vercel.app';

  String? _token;
  String? _cookieName;
  Map<String, dynamic>? currentUser;

  bool get isLoggedIn => _token != null && _cookieName != null;

  static Future<ApiClient> restore() async {
    final prefs = await SharedPreferences.getInstance();
    final client = ApiClient();
    client._token = prefs.getString('tb_token');
    client._cookieName = prefs.getString('tb_cookie');
    final raw = prefs.getString('tb_user');
    if (raw != null) {
      try {
        client.currentUser = jsonDecode(raw) as Map<String, dynamic>;
      } catch (_) {}
    }
    return client;
  }

  Map<String, String> _headers({bool json = false}) {
    final headers = <String, String>{'Accept': 'application/json'};
    if (json) headers['Content-Type'] = 'application/json';
    if (_token != null && _cookieName != null) {
      headers['Cookie'] = '$_cookieName=$_token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    late http.Response response;
    try {
      if (method == 'GET') {
        response = await http
            .get(uri, headers: _headers())
            .timeout(const Duration(seconds: 30));
      } else {
        response = await http
            .post(uri,
                headers: _headers(json: true), body: jsonEncode(body ?? {}))
            .timeout(const Duration(seconds: 30));
      }
    } catch (error) {
      throw ApiException(
          0, 'Could not reach TrustBridge. Check your connection.');
    }

    Map<String, dynamic> decoded = <String, dynamic>{};
    if (response.body.isNotEmpty) {
      try {
        decoded = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {
        decoded = {'error': 'The server returned an unexpected response.'};
      }
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        response.statusCode,
        (decoded['error'] as String?) ?? 'Request failed.',
        decoded,
      );
    }
    return decoded;
  }

  Future<void> _storeSession(Map<String, dynamic> data) async {
    _token = data['token'] as String?;
    _cookieName = data['cookieName'] as String?;
    currentUser = (data['user'] as Map?)?.cast<String, dynamic>();
    final prefs = await SharedPreferences.getInstance();
    if (_token != null) {
      await prefs.setString('tb_token', _token!);
    }
    if (_cookieName != null) {
      await prefs.setString('tb_cookie', _cookieName!);
    }
    if (currentUser != null) {
      await prefs.setString('tb_user', jsonEncode(currentUser));
    }
  }

  Future<Map<String, dynamic>> login(String role) async {
    final data =
        await _request('POST', '/api/mobile/login', body: {'role': role});
    await _storeSession(data);
    return data;
  }

  Future<Map<String, dynamic>?> pollGoogleSignIn(String device) async {
    final uri = Uri.parse('$baseUrl/api/mobile/auth/poll?device=$device');
    late http.Response response;
    try {
      response = await http.get(uri, headers: {
        'Accept': 'application/json'
      }).timeout(const Duration(seconds: 20));
    } catch (_) {
      throw ApiException(
          0, 'Could not reach TrustBridge. Check your connection.');
    }
    if (response.statusCode == 202) return null;

    Map<String, dynamic> data = <String, dynamic>{};
    if (response.body.isNotEmpty) {
      try {
        data = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {
        data = {'error': 'The server returned an unexpected response.'};
      }
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        response.statusCode,
        (data['error'] as String?) ?? 'Google sign-in failed.',
        data,
      );
    }
    await _storeSession(data);
    return data;
  }

  Future<void> signOut() async {
    _token = null;
    _cookieName = null;
    currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('tb_token');
    await prefs.remove('tb_cookie');
    await prefs.remove('tb_user');
  }

  Future<Map<String, dynamic>> home() => _request('GET', '/api/mobile/home');

  Future<Map<String, dynamic>> deals() => _request('GET', '/api/mobile/deals');

  Future<Map<String, dynamic>> deal(String token) =>
      _request('GET', '/api/mobile/deals/$token');

  Future<Map<String, dynamic>> profile() =>
      _request('GET', '/api/mobile/profile');

  Future<Map<String, dynamic>> runCheck(Map<String, dynamic> input) =>
      _request('POST', '/api/check', body: input);

  Future<Map<String, dynamic>> milestoneAction({
    required String token,
    required String milestoneId,
    required String action,
    String note = '',
    bool acknowledgeUnverified = false,
  }) =>
      _request(
        'POST',
        '/api/deals/$token/milestones/$milestoneId',
        body: {
          'action': action,
          'note': note,
          'acknowledgeUnverified': acknowledgeUnverified,
        },
      );
}
