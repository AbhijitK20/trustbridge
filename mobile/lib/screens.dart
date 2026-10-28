import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';
import 'theme.dart';

Future<void> openExternal(BuildContext context, String url) async {
  try {
    final ok = await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    );
    if (!ok && context.mounted) {
      showSnack(context, 'Could not open the link.');
    }
  } catch (_) {
    if (context.mounted) showSnack(context, 'Could not open the link.');
  }
}

void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

String initials(String? name) {
  if (name == null || name.trim().isEmpty) return 'TB';
  return name
      .trim()
      .split(RegExp(r'\s+'))
      .take(2)
      .map((part) => part[0].toUpperCase())
      .join();
}

class Brand extends StatelessWidget {
  const Brand({super.key, this.light = false});

  final bool light;

  @override
  Widget build(BuildContext context) {
    final color = light ? Colors.white : TB.ink;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 29,
          height: 29,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: TB.green,
            shape: BoxShape.circle,
          ),
          child: Text(
            'T',
            style: TextStyle(
              color: TB.lime,
              fontSize: 18,
              fontFamily: 'serif',
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
        const SizedBox(width: 9),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'trustbridge',
              style: TextStyle(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.9,
              ),
            ),
            Text(
              'PROTECTED WORKSPACE',
              style: monoStyle(
                6.5,
                color:
                    light ? const Color(0xFFC9BFAE) : const Color(0xFF8A836F),
                spacing: 1.1,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.name, this.size = 34});

  final String? name;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(color: TB.green, shape: BoxShape.circle),
      child: Text(
        initials(name),
        style: monoStyle(size * 0.28, color: TB.lime, spacing: 0.5),
      ),
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text.toUpperCase(), style: monoStyle(8.5, spacing: 1.1));
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.11),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        statusLabel(status),
        style: monoStyle(7.5, color: color, spacing: 0.5),
      ),
    );
  }
}

class PageHeader extends StatelessWidget {
  const PageHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.subtitle,
  });

  final String eyebrow;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: TB.lime,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                eyebrow.toUpperCase(),
                style: monoStyle(8.5, color: TB.green, spacing: 1.2),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            title,
            style: const TextStyle(
              fontSize: 39,
              fontWeight: FontWeight.w500,
              letterSpacing: -2.0,
              height: 0.98,
              color: TB.ink,
            ),
          ),
          const SizedBox(height: 11),
          Text(
            subtitle,
            style: const TextStyle(color: TB.muted, fontSize: 12, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class DealCard extends StatelessWidget {
  const DealCard({super.key, required this.deal, required this.onTap});

  final Map<String, dynamic> deal;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final milestones =
        ((deal['milestones'] as List?) ?? []).cast<Map<String, dynamic>>();
    final released =
        milestones.where((item) => item['status'] == 'RELEASED').length;
    final status = (deal['status'] as String?) ?? 'DRAFT';
    final currency = (deal['currency'] as String?) ?? 'inr';
    final amount = ((deal['priceCents'] as num?) ?? 0).toInt();
    final seller = (deal['seller'] as Map?)?.cast<String, dynamic>();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: TB.paper,
        border: Border.all(color: const Color(0xFFE2DAC9)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    StatusChip(status: status),
                    const Spacer(),
                    Text(
                      money(amount, currency),
                      style: monoStyle(9.5, color: TB.ink, spacing: 0.2),
                    ),
                  ],
                ),
                const SizedBox(height: 13),
                Text(
                  (deal['title'] as String?) ?? 'Protected deal',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.7,
                    color: TB.ink,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        (seller?['name'] as String?) ?? 'Seller',
                        style: const TextStyle(color: TB.muted, fontSize: 10),
                      ),
                    ),
                    Text(
                      milestones.isNotEmpty
                          ? '$released/${milestones.length} milestones'
                          : 'Protected',
                      style: const TextStyle(color: TB.muted, fontSize: 10),
                    ),
                  ],
                ),
                if (milestones.isNotEmpty) ...[
                  const SizedBox(height: 11),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value:
                          milestones.isEmpty ? 0 : released / milestones.length,
                      minHeight: 3,
                      backgroundColor: const Color(0xFFEFE6D1),
                      valueColor: const AlwaysStoppedAnimation(TB.green),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.body,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String body;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: TB.paper,
        border: Border.all(color: const Color(0xFFE2DAC9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.7,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            body,
            style: const TextStyle(color: TB.muted, fontSize: 11, height: 1.5),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 15),
            FilledButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String? _busyRole;
  String? _error;
  bool _googleBusy = false;
  bool _polling = false;
  Timer? _pollTimer;

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  String _deviceCode() {
    const alphabet =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = math.Random.secure();
    return List.generate(48, (_) => alphabet[random.nextInt(alphabet.length)])
        .join();
  }

  Future<void> _pollGoogle(String device) async {
    if (_polling || !mounted) return;
    _polling = true;
    try {
      final data = await widget.api.pollGoogleSignIn(device);
      if (!mounted) return;
      if (data != null) {
        _pollTimer?.cancel();
        setState(() {
          _googleBusy = false;
          _error = null;
        });
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => Shell(api: widget.api)),
        );
      }
    } catch (error) {
      _pollTimer?.cancel();
      if (mounted) {
        setState(() {
          _googleBusy = false;
          _error = error.toString();
        });
      }
    } finally {
      _polling = false;
    }
  }

  Future<void> _googleLogin() async {
    if (_googleBusy) return;
    final device = _deviceCode();
    final next =
        Uri.encodeComponent('/api/mobile/auth/complete?device=$device');
    setState(() {
      _googleBusy = true;
      _error = null;
    });
    try {
      final opened = await launchUrl(
        Uri.parse('${ApiClient.baseUrl}/signin?next=$next'),
        mode: LaunchMode.externalApplication,
      );
      if (!opened) throw Exception('Could not open the browser.');
      var attempts = 0;
      _pollTimer?.cancel();
      _pollTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
        attempts++;
        if (attempts > 150) {
          timer.cancel();
          if (mounted) {
            setState(() {
              _googleBusy = false;
              _error = 'Google sign-in timed out. Try again.';
            });
          }
          return;
        }
        _pollGoogle(device);
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _googleBusy = false;
          _error = error.toString();
        });
      }
    }
  }

  Future<void> _login(String role) async {
    setState(() {
      _busyRole = role;
      _error = null;
    });
    try {
      await widget.api.login(role);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => Shell(api: widget.api)),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busyRole = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TB.green,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 36),
          children: [
            const Brand(light: true),
            const SizedBox(height: 52),
            Text(
              'The deal,\nin your pocket.',
              style: serifStyle(49, color: Colors.white, height: 0.98),
            ),
            const SizedBox(height: 16),
            const Text(
              'Verify the claim, then protect the work. Every decision stays on the record.',
              style: TextStyle(
                color: Color(0xFFCFC3AE),
                fontSize: 12,
                height: 1.55,
              ),
            ),
            const SizedBox(height: 34),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: TB.paper,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionLabel('SIGN IN'),
                  const SizedBox(height: 8),
                  const Text(
                    'Start with your account.',
                    style: TextStyle(
                      color: TB.ink,
                      fontSize: 24,
                      fontWeight: FontWeight.w500,
                      letterSpacing: -1.0,
                    ),
                  ),
                  const SizedBox(height: 15),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _googleBusy ? null : _googleLogin,
                      child: _googleBusy
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 1.5,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(width: 10),
                                Text('Waiting for Google…'),
                              ],
                            )
                          : const Text('Continue with Google'),
                    ),
                  ),
                  const SizedBox(height: 7),
                  const Text(
                    'Opens your browser. Return here when you are signed in.',
                    style: TextStyle(color: TB.muted, fontSize: 9, height: 1.4),
                  ),
                  const SizedBox(height: 20),
                  const SectionLabel('OR OPEN A DEMO PORTAL'),
                  const SizedBox(height: 8),
                  _RoleTile(
                    title: 'Buyer',
                    subtitle: 'Check an offer and protect a deal',
                    busy: _busyRole == 'buyer',
                    onTap: () => _login('buyer'),
                  ),
                  _RoleTile(
                    title: 'Seller',
                    subtitle: 'Deliver work and release milestones',
                    busy: _busyRole == 'seller',
                    onTap: () => _login('seller'),
                  ),
                  _RoleTile(
                    title: 'Admin',
                    subtitle: 'Review disputes and delivery',
                    busy: _busyRole == 'admin',
                    onTap: () => _login('admin'),
                  ),
                  _RoleTile(
                    title: 'Second reviewer',
                    subtitle: 'Approve high-value decisions',
                    busy: _busyRole == 'reviewer',
                    onTap: () => _login('reviewer'),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: const TextStyle(
                        color: Color(0xFF90452F),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Verification is unilateral. Protection is bilateral.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFFA79D8A), fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoleTile extends StatelessWidget {
  const _RoleTile({
    required this.title,
    required this.subtitle,
    required this.busy,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE2DAC9)),
        color: TB.cream.withOpacity(0.45),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: busy ? null : onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: TB.ink,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(color: TB.muted, fontSize: 10),
                      ),
                    ],
                  ),
                ),
                busy
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 1.5),
                      )
                    : const Icon(Icons.north_east, size: 16, color: TB.green),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class Shell extends StatefulWidget {
  const Shell({super.key, required this.api});

  final ApiClient api;

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _index = 0;

  void _openDeal(String token) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DealScreen(api: widget.api, token: token),
      ),
    );
  }

  Future<void> _signOut() async {
    await widget.api.signOut();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => LoginScreen(api: widget.api)),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(
        api: widget.api,
        onOpenTab: (index) => setState(() => _index = index),
        onOpenDeal: _openDeal,
      ),
      CheckScreen(api: widget.api),
      DealsScreen(api: widget.api, onOpenDeal: _openDeal),
      CreditsScreen(api: widget.api),
      ChatScreen(api: widget.api),
      ProfileScreen(api: widget.api, onSignOut: _signOut),
    ];
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: IndexedStack(index: _index, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        backgroundColor: TB.paper,
        indicatorColor: TB.limeSoft,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        height: 68,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.qr_code_scanner),
            selectedIcon: Icon(Icons.qr_code_scanner),
            label: 'Check',
          ),
          NavigationDestination(
            icon: Icon(Icons.layers_outlined),
            selectedIcon: Icon(Icons.layers),
            label: 'Deals',
          ),
          NavigationDestination(
            icon: Icon(Icons.toll_outlined),
            selectedIcon: Icon(Icons.toll),
            label: 'Credits',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: 'Chat',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.api,
    required this.onOpenTab,
    required this.onOpenDeal,
  });

  final ApiClient api;
  final ValueChanged<int> onOpenTab;
  final ValueChanged<String> onOpenDeal;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.home();
  }

  Future<void> _refresh() async {
    final future = widget.api.home();
    setState(() => _future = future);
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return _ErrorView(
            error: snapshot.error.toString(),
            onRetry: _refresh,
          );
        }
        final data = snapshot.data ?? {};
        final user = (data['user'] as Map?)?.cast<String, dynamic>() ?? {};
        final stats = (data['stats'] as Map?)?.cast<String, dynamic>() ?? {};
        final deals =
            ((data['deals'] as List?) ?? []).cast<Map<String, dynamic>>();
        final active = deals
            .where(
              (deal) =>
                  !['RELEASED', 'REFUNDED', 'EXPIRED'].contains(deal['status']),
            )
            .toList();
        final name = (user['name'] as String?) ?? 'there';
        final firstName = name.split(RegExp(r'\s+')).first;
        return RefreshIndicator(
          onRefresh: _refresh,
          color: TB.green,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
            children: [
              Row(
                children: [
                  const Brand(),
                  const Spacer(),
                  Avatar(name: name),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'Hello, ',
                            style: const TextStyle(
                              fontSize: 37,
                              fontWeight: FontWeight.w500,
                              letterSpacing: -1.8,
                              color: TB.ink,
                            ),
                          ),
                          TextSpan(
                            text: '$firstName.',
                            style: serifStyle(39, color: TB.ink),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Container(
                    width: 38,
                    height: 38,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      color: TB.limeSoft,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      initials(name),
                      style: monoStyle(9, color: TB.green),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'Verify the claim, then protect the work. Every decision stays on the record.',
                style: TextStyle(color: TB.muted, fontSize: 11, height: 1.55),
              ),
              const SizedBox(height: 20),
              _HeroCard(
                onCheck: () => widget.onOpenTab(1),
                onCreate: () =>
                    openExternal(context, '${ApiClient.baseUrl}/create'),
              ),
              const SizedBox(height: 14),
              _StatsRow(stats: stats),
              const SizedBox(height: 28),
              const SectionLabel('QUICK ACTIONS'),
              const SizedBox(height: 7),
              const Text(
                'Keep moving.',
                style: TextStyle(
                  fontSize: 25,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -1.0,
                  color: TB.ink,
                ),
              ),
              const SizedBox(height: 13),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.22,
                children: [
                  _QuickCard(
                    index: '01',
                    title: 'Verify a claim',
                    subtitle:
                        'Four outcomes. Evidence tiers. No fake certainty.',
                    onTap: () => widget.onOpenTab(1),
                  ),
                  _QuickCard(
                    index: '02',
                    title: 'New deal',
                    subtitle: 'Write the scope and set milestones.',
                    onTap: () =>
                        openExternal(context, '${ApiClient.baseUrl}/create'),
                  ),
                  _QuickCard(
                    index: '03',
                    title: 'My deals',
                    subtitle: 'Track delivery, milestones, and signatures.',
                    onTap: () => widget.onOpenTab(2),
                  ),
                  _QuickCard(
                    index: '04',
                    title: 'Referee chat',
                    subtitle: 'Paste an offer and get a reply you can send.',
                    dark: true,
                    onTap: () => widget.onOpenTab(4),
                  ),
                ],
              ),
              const SizedBox(height: 28),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionLabel('IN FLIGHT'),
                        SizedBox(height: 7),
                        Text(
                          'Your deals.',
                          style: TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -1.0,
                            color: TB.ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => widget.onOpenTab(2),
                    child: const Text('See all'),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (active.isEmpty)
                EmptyState(
                  title: 'No active deals yet.',
                  body:
                      'Start with a check, then turn the verdict into a protected agreement.',
                  actionLabel: 'Create a protected deal',
                  onAction: () =>
                      openExternal(context, '${ApiClient.baseUrl}/create'),
                )
              else
                ...active.take(4).map(
                      (deal) => DealCard(
                        deal: deal,
                        onTap: () => widget.onOpenDeal(deal['token'] as String),
                      ),
                    ),
              const SizedBox(height: 27),
              const Divider(height: 1),
              const SizedBox(height: 18),
              const SectionLabel('THE RULE'),
              const SizedBox(height: 8),
              Text(
                '“Verification is unilateral. Protection is bilateral.”',
                style: serifStyle(21, color: TB.green, height: 1.15),
              ),
              const SizedBox(height: 8),
              const Text(
                'TrustBridge never claims to be a bank or licensed escrow. Funds are held by the named payment partner; human review decides disputes.',
                style: TextStyle(color: TB.muted, fontSize: 9.5, height: 1.55),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.onCheck, required this.onCreate});

  final VoidCallback onCheck;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: TB.green,
        borderRadius: BorderRadius.circular(23),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -8,
            bottom: -22,
            child: Container(
              width: 90,
              height: 90,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF4A4132)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('T', style: serifStyle(33, color: TB.lime)),
                  Text(
                    'EVIDENCE FIRST',
                    style: monoStyle(
                      5.8,
                      color: const Color(0xFFC9BFAE),
                      spacing: 0.8,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'THE TRUST LAYER',
                style: TextStyle(
                  color: Color(0xFFC9BFAE),
                  fontSize: 8,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 26),
              Text.rich(
                TextSpan(
                  children: [
                    const TextSpan(
                      text: 'A screenshot\n',
                      style: TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 30,
                        color: Colors.white,
                        height: 1.0,
                        letterSpacing: -1.3,
                      ),
                    ),
                    TextSpan(
                      text: 'is not proof.',
                      style: serifStyle(34, color: TB.lime),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Check the offer against independent evidence before you send money. If the record is incomplete, protect the deal instead.',
                style: TextStyle(
                  color: Color(0xFFCFC3AE),
                  fontSize: 10,
                  height: 1.55,
                ),
              ),
              const SizedBox(height: 20),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: TB.lime,
                  foregroundColor: TB.green,
                ),
                onPressed: onCheck,
                child: const Text('Check an offer ↗'),
              ),
              const SizedBox(height: 8),
              TextButton(
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFFD2D6BD),
                  padding: EdgeInsets.zero,
                ),
                onPressed: onCreate,
                child: const Text(
                  'Protect a deal',
                  style: TextStyle(
                    fontSize: 10,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.stats});

  final Map<String, dynamic> stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: TB.paper,
        border: Border.all(color: const Color(0xFFE2DAC9)),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Expanded(
              child: _Stat(
                value: '${stats['activeDeals'] ?? 0}',
                label: 'ACTIVE DEALS',
              ),
            ),
            const VerticalDivider(
              width: 1,
              thickness: 1,
              color: Color(0xFFE6DFD0),
            ),
            Expanded(
              child: _Stat(
                value: money(
                  ((stats['protectedCents'] as num?) ?? 0).toInt(),
                  'inr',
                ),
                label: 'PROTECTED',
              ),
            ),
            const VerticalDivider(
              width: 1,
              thickness: 1,
              color: Color(0xFFE6DFD0),
            ),
            Expanded(
              child: _Stat(
                value: '${stats['openDisputes'] ?? 0}',
                label: 'OPEN DISPUTES',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: TB.ink,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(label, style: monoStyle(6.5, spacing: 0.5)),
        ],
      ),
    );
  }
}

class _QuickCard extends StatelessWidget {
  const _QuickCard({
    required this.index,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.dark = false,
  });

  final String index;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final foreground = dark ? Colors.white : TB.ink;
    return Container(
      decoration: BoxDecoration(
        color: dark ? TB.green : TB.paper,
        border: Border.all(color: dark ? TB.green : const Color(0xFFE2DAC9)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(13),
            child: Stack(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      index,
                      style: monoStyle(
                        8,
                        color: dark
                            ? const Color(0xFFC9BFAE)
                            : const Color(0xFF8A836F),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      title,
                      style: TextStyle(
                        color: foreground,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: dark ? const Color(0xFFC9BFAE) : TB.muted,
                        fontSize: 9,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Text(
                    '↗',
                    style: TextStyle(
                      color: dark ? Colors.white : TB.green,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class CheckScreen extends StatefulWidget {
  const CheckScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<CheckScreen> createState() => _CheckScreenState();
}

class _CheckScreenState extends State<CheckScreen> {
  final _organization = TextEditingController();
  final _promise = TextEditingController();
  final _amount = TextEditingController();
  final _url = TextEditingController();
  final _evidence = TextEditingController();
  bool _busy = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _organization.dispose();
    _promise.dispose();
    _amount.dispose();
    _url.dispose();
    _evidence.dispose();
    super.dispose();
  }

  void _prefill() {
    _organization.text = 'Google';
    _promise.text =
        'Google requires a ₹1,500 refundable registration fee to confirm an internship.';
    _amount.text = '1500';
    _url.text = 'https://careers.google.com/';
    _evidence.text =
        'WhatsApp screenshot, offer-letter PDF, sender hr.google.intern@gmail.com.';
  }

  Future<void> _run() async {
    if (_organization.text.trim().isEmpty || _promise.text.trim().isEmpty) {
      setState(() => _error = 'Add the organisation and the promise first.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
      _result = null;
    });
    try {
      final result = await widget.api.runCheck({
        'organization': _organization.text.trim(),
        'counterpartyName': '',
        'counterpartyEmail': '',
        'promise': _promise.text.trim(),
        'amount': _amount.text.trim(),
        'officialUrl': _url.text.trim(),
        'evidenceText': _evidence.text.trim(),
      });
      if (mounted) setState(() => _result = result);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _protect() {
    final query = Uri(
      queryParameters: {
        'title': _promise.text.trim().split('\n').first,
        'description': _promise.text.trim(),
        'price': _amount.text.trim(),
      },
    ).query;
    openExternal(context, '${ApiClient.baseUrl}/create?$query');
  }

  @override
  Widget build(BuildContext context) {
    final result = _result;
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: [
        const Brand(),
        const PageHeader(
          eyebrow: 'VERIFY BEFORE YOU PAY',
          title: 'What are you\nbeing asked to believe?',
          subtitle:
              'Paste the promise. Add the evidence you have. TrustBridge separates claims from proof and tells you what it still cannot determine.',
        ),
        OutlinedButton.icon(
          onPressed: _prefill,
          icon: const Icon(Icons.bolt_outlined, size: 16),
          label: const Text('Use the fake Google internship example'),
        ),
        const SizedBox(height: 13),
        TextField(
          controller: _organization,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            labelText: 'Organisation or sender',
            hintText: 'e.g. Google',
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _promise,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'What is being promised?',
            hintText: 'Paste the message, job offer, or deal terms.',
          ),
        ),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _amount,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Amount',
                  hintText: '1500',
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _url,
                keyboardType: TextInputType.url,
                decoration: const InputDecoration(
                  labelText: 'Official URL',
                  hintText: 'https://',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _evidence,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Evidence you have',
            hintText: 'Screenshots, sender email, documents...',
          ),
        ),
        const SizedBox(height: 14),
        FilledButton(
          onPressed: _busy ? null : _run,
          child: _busy
              ? const SizedBox(
                  width: 17,
                  height: 17,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.6,
                    color: Colors.white,
                  ),
                )
              : const Text('Run verification ↗'),
        ),
        if (_error != null) ...[
          const SizedBox(height: 11),
          Text(
            _error!,
            style: const TextStyle(
              color: Color(0xFF90452F),
              fontSize: 11,
              height: 1.4,
            ),
          ),
        ],
        if (result != null) ...[
          const SizedBox(height: 22),
          _CheckResult(data: result, onProtect: _protect),
        ],
      ],
    );
  }
}

class _CheckResult extends StatelessWidget {
  const _CheckResult({required this.data, required this.onProtect});

  final Map<String, dynamic> data;
  final VoidCallback onProtect;

  @override
  Widget build(BuildContext context) {
    final outcome = (data['outcome'] as String?) ?? 'UNDETERMINED';
    final color = outcomeColor(outcome);
    final coverage = (data['coverage'] as Map?)?.cast<String, dynamic>() ?? {};
    final open = ((data['couldNotDetermine'] as List?) ?? []).cast<dynamic>();
    final conditions = ((data['conditions'] as List?) ?? []).cast<dynamic>();
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: TB.paper,
        border: Border.all(color: color.withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  outcomeLabel(outcome),
                  style: monoStyle(8, color: color, spacing: 0.5),
                ),
              ),
              const Spacer(),
              Text(
                '#${((data['id'] as String?) ?? '').split('-').first.toUpperCase()}',
                style: monoStyle(8, color: TB.muted),
              ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            (data['headline'] as String?) ?? 'Result',
            style: const TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.8,
              height: 1.12,
            ),
          ),
          const SizedBox(height: 9),
          Text(
            (data['summary'] as String?) ?? '',
            style: const TextStyle(color: TB.muted, fontSize: 11, height: 1.55),
          ),
          const SizedBox(height: 15),
          Container(
            padding: const EdgeInsets.all(11),
            color: TB.cream,
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'RECOMMENDED ACTION',
                    style: TextStyle(
                      fontSize: 7,
                      letterSpacing: 1.0,
                      color: TB.muted,
                    ),
                  ),
                ),
                Flexible(
                  child: Text(
                    (data['decision'] as String? ?? '')
                        .replaceAll('_', ' ')
                        .toLowerCase(),
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: TB.ink,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 15),
          Row(
            children: ['E0', 'E1', 'E2', 'E3'].map((tier) {
              return Expanded(
                child: Column(
                  children: [
                    Text(
                      '${coverage[tier] ?? 0}',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(tier, style: monoStyle(8)),
                  ],
                ),
              );
            }).toList(),
          ),
          if (open.isNotEmpty) ...[
            const SizedBox(height: 18),
            const SectionLabel('WHAT WE COULD NOT DETERMINE'),
            const SizedBox(height: 7),
            ...open.take(6).map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      '• $item',
                      style: const TextStyle(
                        color: TB.muted,
                        fontSize: 10,
                        height: 1.4,
                      ),
                    ),
                  ),
                ),
          ],
          if (conditions.isNotEmpty) ...[
            const SizedBox(height: 13),
            const SectionLabel('CONDITIONS'),
            const SizedBox(height: 7),
            ...conditions.take(4).map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      '• $item',
                      style: const TextStyle(
                        color: TB.muted,
                        fontSize: 10,
                        height: 1.4,
                      ),
                    ),
                  ),
                ),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: onProtect,
            child: const Text('Turn this into a protected deal ↗'),
          ),
        ],
      ),
    );
  }
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _input = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _sentText;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  String _firstMatch(String text, RegExp pattern) =>
      pattern.firstMatch(text)?.group(0) ?? '';

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _busy) return;
    final organization = _firstMatch(
      text,
      RegExp(
          r'\b(Google|Microsoft|Amazon|Meta|Apple|Flipkart|Infosys|TCS|Wipro)\b',
          caseSensitive: false),
    );
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final result = await widget.api.runCheck({
        'organization':
            organization.isEmpty ? 'Unknown organisation' : organization,
        'counterpartyName': '',
        'counterpartyEmail': _firstMatch(
          text,
          RegExp(r'[\w.+-]+@[\w.-]+\.[a-z]{2,}', caseSensitive: false),
        ),
        'promise': text,
        'amount': _firstMatch(text, RegExp(r'₹\s?([\d,]+)'))
            .replaceAll('₹', '')
            .replaceAll(',', '')
            .trim(),
        'officialUrl': _firstMatch(text, RegExp(r'https?://[^\s)]+')),
        'evidenceText': 'Pasted into the TrustBridge referee chat.',
      });
      if (!mounted) return;
      setState(() {
        _result = result;
        _sentText = text;
        _input.clear();
      });
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _protect() {
    final text = _sentText ?? _input.text.trim();
    if (text.isEmpty) return;
    final query = Uri(
      queryParameters: {
        'title': text.split('\n').first,
        'description': text,
      },
    ).query;
    openExternal(context, '${ApiClient.baseUrl}/create?$query');
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
      children: [
        const Brand(),
        const PageHeader(
          eyebrow: 'THE DEAL REFEREE',
          title: 'Say it in chat.\nCheck it in chat.',
          subtitle:
              'Paste the offer, the sender email, or a link. TrustBridge separates the claim from the evidence.',
        ),
        Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: TB.paper,
            border: Border.all(color: TB.line),
          ),
          child: const Text(
            "Paste the offer, the sender's email, or a link. I'll separate the claim from the evidence and draft a reply you can send.",
            style: TextStyle(color: TB.muted, fontSize: 11, height: 1.55),
          ),
        ),
        if (_sentText != null) ...[
          const SizedBox(height: 9),
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              constraints: const BoxConstraints(maxWidth: 290),
              padding: const EdgeInsets.all(13),
              decoration: const BoxDecoration(color: TB.green),
              child: Text(
                _sentText!,
                style: const TextStyle(
                    color: Colors.white, fontSize: 11, height: 1.5),
              ),
            ),
          ),
        ],
        if (_busy) ...[
          const SizedBox(height: 14),
          const Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child:
                  CircularProgressIndicator(strokeWidth: 1.6, color: TB.green),
            ),
          ),
        ],
        if (_error != null) ...[
          const SizedBox(height: 10),
          Text(
            _error!,
            style: const TextStyle(
                color: Color(0xFF90452F), fontSize: 11, height: 1.4),
          ),
        ],
        if (_result != null) ...[
          const SizedBox(height: 16),
          _CheckResult(data: _result!, onProtect: _protect),
        ],
        const SizedBox(height: 16),
        TextField(
          controller: _input,
          maxLines: 4,
          minLines: 2,
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(
            labelText: 'Message the referee',
            hintText: 'Paste the offer, message, fee, email, or link...',
          ),
        ),
        const SizedBox(height: 10),
        FilledButton(
          onPressed: _busy || _input.text.trim().isEmpty ? null : _send,
          child: _busy
              ? const SizedBox(
                  width: 17,
                  height: 17,
                  child: CircularProgressIndicator(
                      strokeWidth: 1.6, color: Colors.white),
                )
              : const Text('Send to referee ↗'),
        ),
      ],
    );
  }
}

class DealsScreen extends StatefulWidget {
  const DealsScreen({super.key, required this.api, required this.onOpenDeal});

  final ApiClient api;
  final ValueChanged<String> onOpenDeal;

  @override
  State<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends State<DealsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.deals();
  }

  Future<void> _refresh() async {
    final future = widget.api.deals();
    setState(() => _future = future);
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return _ErrorView(
            error: snapshot.error.toString(),
            onRetry: _refresh,
          );
        }
        final deals = ((snapshot.data?['deals'] as List?) ?? [])
            .cast<Map<String, dynamic>>();
        final active = deals
            .where(
              (deal) =>
                  !['RELEASED', 'REFUNDED', 'EXPIRED'].contains(deal['status']),
            )
            .toList();
        final closed = deals
            .where(
              (deal) =>
                  ['RELEASED', 'REFUNDED', 'EXPIRED'].contains(deal['status']),
            )
            .toList();
        return RefreshIndicator(
          onRefresh: _refresh,
          color: TB.green,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
            children: [
              const Brand(),
              const PageHeader(
                eyebrow: 'YOUR RECORD',
                title: 'Everything\nin one place.',
                subtitle:
                    'Active work, closed deals, and the evidence behind every release.',
              ),
              const SectionLabel('IN FLIGHT'),
              const SizedBox(height: 7),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Expanded(
                    child: Text(
                      'Active deals.',
                      style: TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -1.0,
                        color: TB.ink,
                      ),
                    ),
                  ),
                  Text('${active.length}', style: monoStyle(9)),
                ],
              ),
              const SizedBox(height: 10),
              if (active.isEmpty)
                const EmptyState(
                  title: 'Nothing in flight.',
                  body:
                      'Create a protected deal or check an offer before you pay.',
                )
              else
                ...active.map(
                  (deal) => DealCard(
                    deal: deal,
                    onTap: () => widget.onOpenDeal(deal['token'] as String),
                  ),
                ),
              if (closed.isNotEmpty) ...[
                const SizedBox(height: 26),
                const SectionLabel('CLOSED'),
                const SizedBox(height: 7),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Expanded(
                      child: Text(
                        'The archive.',
                        style: TextStyle(
                          fontSize: 25,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -1.0,
                          color: TB.ink,
                        ),
                      ),
                    ),
                    Text('${closed.length}', style: monoStyle(9)),
                  ],
                ),
                const SizedBox(height: 10),
                Opacity(
                  opacity: 0.72,
                  child: Column(
                    children: closed
                        .map(
                          (deal) => DealCard(
                            deal: deal,
                            onTap: () =>
                                widget.onOpenDeal(deal['token'] as String),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class CreditsScreen extends StatefulWidget {
  const CreditsScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<CreditsScreen> createState() => _CreditsScreenState();
}

class _CreditsScreenState extends State<CreditsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.deals();
  }

  Future<void> _reload() async {
    final future = widget.api.deals();
    setState(() => _future = future);
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return _ErrorView(error: snapshot.error.toString(), onRetry: _reload);
        }
        final deals = (((snapshot.data?['deals'] as List?) ?? []))
            .cast<Map<String, dynamic>>()
            .where(_isFunded)
            .toList();
        var held = 0;
        var released = 0;
        var disputed = 0;
        for (final deal in deals) {
          final price = _price(deal);
          final releasedNow = _released(deal);
          held += _held(deal);
          released += releasedNow;
          if (deal['status'] == 'DISPUTED') disputed += _held(deal);
          if (releasedNow > price) released -= releasedNow - price;
        }
        return RefreshIndicator(
          color: TB.green,
          onRefresh: _reload,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
            children: [
              const Brand(),
              const PageHeader(
                eyebrow: 'PROTECTED CREDITS',
                title: 'Value with\nboundaries.',
                subtitle:
                    'Every credit is one rupee held inside a deal. It is not a wallet.',
              ),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: TB.green,
                  borderRadius: BorderRadius.circular(23),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'HELD IN PROTECTION',
                      style: TextStyle(
                        color: Color(0xFFC9BFAE),
                        fontSize: 8,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      money(held, 'inr'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 39,
                        fontWeight: FontWeight.w500,
                        letterSpacing: -2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${(held / 100).round()} credits · 1 credit = ₹1',
                      style: monoStyle(8.5, color: TB.lime, spacing: 0.5),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        _CreditMetric(
                          label: 'RELEASED',
                          value: money(released, 'inr'),
                        ),
                        const SizedBox(width: 22),
                        _CreditMetric(
                          label: 'DISPUTED',
                          value: money(disputed, 'inr'),
                        ),
                        const SizedBox(width: 22),
                        _CreditMetric(label: 'DEALS', value: '${deals.length}'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: TB.limeSoft,
                  border: Border.all(color: const Color(0xFFE4E6D5)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.lock_outline,
                          size: 16,
                          color: TB.green,
                        ),
                        const SizedBox(width: 7),
                        const SectionLabel('NOT A WALLET'),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'No top-up. No transfers between people. No cash-out. Credits exist only inside a deal and move only to the seller after release, or back to the original buyer after a refund.',
                      style: TextStyle(
                        color: TB.green,
                        fontSize: 10.5,
                        height: 1.55,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 26),
              const SectionLabel('CREDIT LEDGER'),
              const SizedBox(height: 7),
              const Text(
                'Where every rupee sits.',
                style: TextStyle(
                  fontSize: 25,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -1.0,
                  color: TB.ink,
                ),
              ),
              const SizedBox(height: 12),
              if (deals.isEmpty)
                const EmptyState(
                  title: 'No protected credits yet.',
                  body:
                      'Fund a deal to create a protected balance. Credits are not purchased separately.',
                )
              else
                ...deals.map(
                  (deal) => _CreditDealCard(
                    deal: deal,
                    released: _released(deal),
                    held: _held(deal),
                  ),
                ),
              const SizedBox(height: 20),
              const Text(
                'Credits are a unit of account over the payment partner’s protected balance. TrustBridge does not take deposits or issue a wallet.',
                style: TextStyle(color: TB.muted, fontSize: 9.5, height: 1.55),
              ),
            ],
          ),
        );
      },
    );
  }
}

bool _isFunded(Map<String, dynamic> deal) {
  return !['DRAFT', 'AWAITING_PAYMENT'].contains(deal['status']);
}

int _price(Map<String, dynamic> deal) =>
    ((deal['priceCents'] as num?) ?? 0).toInt();

int _released(Map<String, dynamic> deal) {
  final price = _price(deal);
  final status = deal['status'];
  if (status == 'REFUNDED') return 0;
  if (status == 'RELEASED') return price;
  final milestones =
      ((deal['milestones'] as List?) ?? []).cast<Map<String, dynamic>>();
  var released = 0;
  for (final milestone in milestones) {
    if (milestone['status'] == 'RELEASED') {
      released += ((milestone['amountCents'] as num?) ?? 0).toInt();
    }
  }
  return math.min(price, released);
}

int _held(Map<String, dynamic> deal) {
  if (deal['status'] == 'REFUNDED' || deal['status'] == 'RELEASED') return 0;
  return math.max(0, _price(deal) - _released(deal));
}

class _CreditMetric extends StatelessWidget {
  const _CreditMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: monoStyle(6.5, color: const Color(0xFFC9BFAE), spacing: 0.6),
          ),
        ],
      ),
    );
  }
}

class _CreditDealCard extends StatelessWidget {
  const _CreditDealCard({
    required this.deal,
    required this.released,
    required this.held,
  });

  final Map<String, dynamic> deal;
  final int released;
  final int held;

  @override
  Widget build(BuildContext context) {
    final price = _price(deal);
    final status = (deal['status'] as String?) ?? 'HELD';
    final seller = (deal['seller'] as Map?)?.cast<String, dynamic>();
    final milestones =
        ((deal['milestones'] as List?) ?? []).cast<Map<String, dynamic>>();
    final progress =
        price == 0 ? 0.0 : (released / price).clamp(0.0, 1.0).toDouble();
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: TB.paper,
        border: Border.all(color: const Color(0xFFE2DAC9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StatusChip(status: status),
              const Spacer(),
              Text(
                held > 0
                    ? '${money(held, 'inr')} held'
                    : money(released, 'inr'),
                style: monoStyle(9, color: TB.ink, spacing: 0.2),
              ),
            ],
          ),
          const SizedBox(height: 11),
          Text(
            (deal['title'] as String?) ?? 'Protected deal',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: TB.ink,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            (seller?['name'] as String?) ?? 'Seller',
            style: const TextStyle(color: TB.muted, fontSize: 9.5),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 4,
              backgroundColor: const Color(0xFFE9E1D1),
              valueColor: const AlwaysStoppedAnimation(TB.green),
            ),
          ),
          const SizedBox(height: 5),
          Row(
            children: [
              Text(
                '${money(released, 'inr')} released',
                style: monoStyle(7, color: TB.muted),
              ),
              const Spacer(),
              Text(
                '${money(price, 'inr')} protected',
                style: monoStyle(7, color: TB.muted),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.only(top: 9),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Color(0xFFECE4D5))),
            ),
            child: Column(
              children: [
                _CreditLine(
                  label: 'Funded into deal',
                  amount: price,
                  positive: true,
                ),
                if (status == 'REFUNDED')
                  _CreditLine(
                    label: 'Refunded to buyer',
                    amount: price,
                    positive: false,
                  )
                else if (milestones
                    .where((item) => item['status'] == 'RELEASED')
                    .isEmpty)
                  if (status == 'RELEASED')
                    _CreditLine(
                      label: 'Released to seller',
                      amount: price,
                      positive: false,
                    )
                  else
                    const _CreditLine(
                      label: 'No release yet',
                      amount: 0,
                      positive: false,
                    )
                else
                  ...milestones
                      .where((item) => item['status'] == 'RELEASED')
                      .map(
                        (item) => _CreditLine(
                          label:
                              'Milestone ${item['position'] ?? ''} · ${item['title'] ?? 'released'}',
                          amount: ((item['amountCents'] as num?) ?? 0).toInt(),
                          positive: false,
                        ),
                      ),
                if (held > 0)
                  _CreditLine(
                    label: 'Still protected',
                    amount: held,
                    positive: null,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CreditLine extends StatelessWidget {
  const _CreditLine({
    required this.label,
    required this.amount,
    required this.positive,
  });

  final String label;
  final int amount;
  final bool? positive;

  @override
  Widget build(BuildContext context) {
    final color = positive == true
        ? TB.green
        : positive == false
            ? const Color(0xFF90452F)
            : TB.muted;
    final prefix = positive == true
        ? '+'
        : positive == false
            ? '−'
            : '';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: TB.muted, fontSize: 9.5),
            ),
          ),
          Text(
            '$prefix${money(amount, 'inr')}',
            style: monoStyle(8.5, color: color, spacing: 0.2),
          ),
        ],
      ),
    );
  }
}

class DealScreen extends StatefulWidget {
  const DealScreen({super.key, required this.api, required this.token});

  final ApiClient api;
  final String token;

  @override
  State<DealScreen> createState() => _DealScreenState();
}

class _DealScreenState extends State<DealScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.deal(widget.token);
  }

  Future<void> _refresh() async {
    final future = widget.api.deal(widget.token);
    setState(() => _future = future);
    await future;
  }

  Future<void> _act(Map<String, dynamic> milestone, String action) async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: TB.paper,
      builder: (_) => MilestoneActionSheet(
        action: action,
        title: (milestone['title'] as String?) ?? 'Milestone',
        amount: ((milestone['amountCents'] as num?) ?? 0).toInt(),
        requireAck:
            action == 'ACCEPT' && milestone['verificationRequired'] == true,
      ),
    );
    if (result == null) return;
    try {
      await widget.api.milestoneAction(
        token: widget.token,
        milestoneId: milestone['id'] as String,
        action: action,
        note: (result['note'] as String?) ?? '',
        acknowledgeUnverified: (result['ack'] as bool?) ?? false,
      );
      if (!mounted) return;
      showSnack(
        context,
        result['ack'] == true
            ? 'Milestone released with an explicit acknowledgement.'
            : 'Milestone updated.',
      );
      await _refresh();
    } on ApiException catch (error) {
      if (!mounted) return;
      showSnack(context, error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Protected deal')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _ErrorView(
              error: snapshot.error.toString(),
              onRetry: _refresh,
            );
          }
          final data = snapshot.data ?? {};
          final deal = (data['deal'] as Map?)?.cast<String, dynamic>() ?? {};
          final viewer =
              (data['viewer'] as Map?)?.cast<String, dynamic>() ?? {};
          final isBuyer = viewer['isBuyer'] == true;
          final isSeller = viewer['isSeller'] == true;
          final milestones = ((deal['milestones'] as List?) ?? [])
              .cast<Map<String, dynamic>>();
          final contract = (deal['contract'] as Map?)?.cast<String, dynamic>();
          final currency = (deal['currency'] as String?) ?? 'inr';
          final outcome = deal['verificationOutcome'] as String?;
          final seller =
              (deal['seller'] as Map?)?.cast<String, dynamic>() ?? {};
          return RefreshIndicator(
            onRefresh: _refresh,
            color: TB.green,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(18, 4, 18, 28),
              children: [
                Row(
                  children: [
                    StatusChip(status: (deal['status'] as String?) ?? 'HELD'),
                    const Spacer(),
                    Text(
                      '#${widget.token.substring(widget.token.length > 6 ? widget.token.length - 6 : 0).toUpperCase()}',
                      style: monoStyle(8),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  (deal['title'] as String?) ?? 'Protected deal',
                  style: const TextStyle(
                    fontSize: 33,
                    fontWeight: FontWeight.w500,
                    letterSpacing: -1.8,
                    height: 0.98,
                    color: TB.ink,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  (deal['description'] as String?) ?? '',
                  style: const TextStyle(
                    color: TB.muted,
                    fontSize: 11.5,
                    height: 1.55,
                  ),
                ),
                const SizedBox(height: 19),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      money(
                        ((deal['priceCents'] as num?) ?? 0).toInt(),
                        currency,
                      ),
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w500,
                        letterSpacing: -1.2,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 5),
                      child: Text(
                        'PROTECTED TOTAL',
                        style: TextStyle(
                          fontSize: 7,
                          letterSpacing: 1.0,
                          color: TB.muted,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 19),
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFE2DAC9)),
                    color: TB.paper,
                  ),
                  child: IntrinsicHeight(
                    child: Row(
                      children: [
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(13),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SectionLabel('SELLER'),
                                const SizedBox(height: 5),
                                Text(
                                  (seller['name'] as String?) ?? 'Seller',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  seller['verified'] == true
                                      ? 'Verified seller'
                                      : 'Identity pending',
                                  style: const TextStyle(
                                    color: TB.muted,
                                    fontSize: 9,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const VerticalDivider(
                          width: 1,
                          thickness: 1,
                          color: Color(0xFFE6DFD0),
                        ),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(13),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SectionLabel('DELIVERY'),
                                const SizedBox(height: 5),
                                Text(
                                  shortDate(
                                    deal['deliveryDeadline'] as String?,
                                  ),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  milestones.isNotEmpty
                                      ? '${milestones.length} milestones'
                                      : 'Single delivery',
                                  style: const TextStyle(
                                    color: TB.muted,
                                    fontSize: 9,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (outcome != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: TB.paper,
                      border: Border.all(
                        color: outcomeColor(outcome).withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Verification · ${outcomeLabel(outcome)}',
                            style: TextStyle(
                              color: outcomeColor(outcome),
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Text(
                          outcome == 'UNDETERMINED'
                              ? 'Protect, do not assume'
                              : 'Evidence attached',
                          style: const TextStyle(color: TB.muted, fontSize: 9),
                        ),
                      ],
                    ),
                  ),
                ],
                if (milestones.isNotEmpty) ...[
                  const SizedBox(height: 26),
                  Row(
                    children: [
                      const Expanded(
                        child: SectionLabel('VERIFICATION-GATED MILESTONES'),
                      ),
                      Text(
                        '${milestones.where((m) => m['status'] == 'RELEASED').length}/${milestones.length} released',
                        style: monoStyle(7.5),
                      ),
                    ],
                  ),
                  const SizedBox(height: 13),
                  ...milestones.map(
                    (milestone) => _MilestoneCard(
                      milestone: milestone,
                      currency: currency,
                      isBuyer: isBuyer,
                      isSeller: isSeller,
                      outcome: outcome,
                      onAction: (action) => _act(milestone, action),
                    ),
                  ),
                ],
                const SizedBox(height: 23),
                _ContractCard(
                  token: widget.token,
                  contract: contract,
                  onOpen: () => openExternal(
                    context,
                    '${ApiClient.baseUrl}/deal/${widget.token}/contract',
                  ),
                  onPdf: () => openExternal(
                    context,
                    '${ApiClient.baseUrl}/api/deals/${widget.token}/contract/pdf',
                  ),
                ),
                if (milestones.isEmpty) ...[
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: () => openExternal(
                      context,
                      '${ApiClient.baseUrl}/deal/${widget.token}',
                    ),
                    child: const Text('Open full deal actions in browser'),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MilestoneCard extends StatelessWidget {
  const _MilestoneCard({
    required this.milestone,
    required this.currency,
    required this.isBuyer,
    required this.isSeller,
    required this.outcome,
    required this.onAction,
  });

  final Map<String, dynamic> milestone;
  final String currency;
  final bool isBuyer;
  final bool isSeller;
  final String? outcome;
  final ValueChanged<String> onAction;

  @override
  Widget build(BuildContext context) {
    final status = (milestone['status'] as String?) ?? 'PENDING';
    final verificationRequired = milestone['verificationRequired'] == true;
    final canSubmit =
        isSeller && ['PENDING', 'CHANGES_REQUESTED'].contains(status);
    final canReview = isBuyer && status == 'SUBMITTED';
    final contradicted = verificationRequired && outcome == 'CONTRADICTED';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: TB.paper,
        border: Border.all(color: const Color(0xFFE2DAC9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('M${milestone['position'] ?? ''}', style: monoStyle(8)),
              const SizedBox(width: 8),
              StatusChip(status: status == 'RELEASED' ? 'RELEASED' : status),
              const Spacer(),
              Text(
                money(
                  ((milestone['amountCents'] as num?) ?? 0).toInt(),
                  currency,
                ),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 11),
          Text(
            (milestone['title'] as String?) ?? 'Milestone',
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: TB.ink,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            (milestone['description'] as String?) ?? '',
            style: const TextStyle(
              color: TB.muted,
              fontSize: 10.5,
              height: 1.5,
            ),
          ),
          if (milestone['acceptanceCriteria'] != null) ...[
            const SizedBox(height: 9),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(9),
              color: const Color(0xFFF6EFDF),
              child: Text(
                'ACCEPTANCE  ${milestone['acceptanceCriteria']}',
                style: const TextStyle(
                  color: Color(0xFF6E6A5E),
                  fontSize: 9,
                  height: 1.4,
                ),
              ),
            ),
          ],
          if (milestone['submissionNote'] != null) ...[
            const SizedBox(height: 9),
            Text('SELLER SUBMISSION', style: monoStyle(7.5, color: TB.green)),
            const SizedBox(height: 3),
            Text(
              milestone['submissionNote'] as String,
              style: const TextStyle(
                color: TB.muted,
                fontSize: 10,
                height: 1.45,
              ),
            ),
          ],
          if (milestone['reviewNote'] != null) ...[
            const SizedBox(height: 7),
            Text(
              'BUYER NOTE  ${milestone['reviewNote']}',
              style: const TextStyle(
                color: TB.muted,
                fontSize: 9.5,
                height: 1.4,
              ),
            ),
          ],
          if (milestone['releasedAt'] != null) ...[
            const SizedBox(height: 9),
            Text(
              'Released ${shortDate(milestone['releasedAt'] as String?)}',
              style: monoStyle(7.5, color: TB.green),
            ),
          ],
          if (canSubmit || canReview) ...[
            const SizedBox(height: 12),
            if (contradicted)
              const Text(
                'Verification contradicted a material claim. This milestone cannot be released.',
                style: TextStyle(
                  color: Color(0xFF90452F),
                  fontSize: 10,
                  height: 1.4,
                ),
              ),
            if (canSubmit)
              FilledButton(
                onPressed: () => onAction('SUBMIT'),
                child: const Text('Submit milestone ↗'),
              ),
            if (canReview) ...[
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: contradicted ? null : () => onAction('ACCEPT'),
                      child: const Text('Review & release'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => onAction('REQUEST_CHANGES'),
                      child: const Text('Request changes'),
                    ),
                  ),
                ],
              ),
              if (verificationRequired && outcome == 'UNDETERMINED')
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'Verification is unresolved. You will confirm that risk before release.',
                    style: TextStyle(
                      color: Color(0xFF7A6636),
                      fontSize: 9,
                      height: 1.4,
                    ),
                  ),
                ),
            ],
          ],
        ],
      ),
    );
  }
}

class _ContractCard extends StatelessWidget {
  const _ContractCard({
    required this.token,
    required this.contract,
    required this.onOpen,
    required this.onPdf,
  });

  final String token;
  final Map<String, dynamic>? contract;
  final VoidCallback onOpen;
  final VoidCallback onPdf;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(17),
      color: TB.green,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'DEAL PASSPORT',
            style: monoStyle(8, color: const Color(0xFFC9BFAE), spacing: 1.1),
          ),
          const SizedBox(height: 9),
          Text(
            'One agreement.\nEvery claim attached.',
            style: serifStyle(25, color: Colors.white, height: 1.05),
          ),
          const SizedBox(height: 8),
          Text(
            'The contract snapshots the scope, milestones, verification outcome, and evidence manifest. Both parties sign the same hash.',
            style: const TextStyle(
              color: Color(0xFFCFC3AE),
              fontSize: 9.5,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            contract == null
                ? 'Draft on open'
                : '${contract!['number']}  ·  ${(contract!['status'] as String? ?? '').replaceAll('_', ' ').toLowerCase()}',
            style: monoStyle(8, color: const Color(0xFFD6CBB6)),
          ),
          const SizedBox(height: 13),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: TB.lime,
                    foregroundColor: TB.green,
                  ),
                  onPressed: onOpen,
                  child: const Text('Open contract'),
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: onPdf,
                child: const Text(
                  'PDF',
                  style: TextStyle(color: Color(0xFFD6CBB6)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class MilestoneActionSheet extends StatefulWidget {
  const MilestoneActionSheet({
    super.key,
    required this.action,
    required this.title,
    required this.amount,
    required this.requireAck,
  });

  final String action;
  final String title;
  final int amount;
  final bool requireAck;

  @override
  State<MilestoneActionSheet> createState() => _MilestoneActionSheetState();
}

class _MilestoneActionSheetState extends State<MilestoneActionSheet> {
  final _note = TextEditingController();
  bool _ack = false;

  bool get _isAccept => widget.action == 'ACCEPT';
  bool get _isSubmit => widget.action == 'SUBMIT';
  bool get _needsNote => _isSubmit || widget.action == 'REQUEST_CHANGES';

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  void _done() {
    if (_needsNote && _note.text.trim().length < 10) {
      showSnack(context, 'Add a note of at least 10 characters.');
      return;
    }
    if (_isAccept && widget.requireAck && !_ack) {
      showSnack(context, 'Tick the acknowledgement before releasing.');
      return;
    }
    Navigator.of(context).pop({'note': _note.text.trim(), 'ack': _ack});
  }

  @override
  Widget build(BuildContext context) {
    final label = _isAccept
        ? 'Review and release'
        : _isSubmit
            ? 'Submit milestone'
            : 'Request changes';
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.viewInsetsOf(context).bottom + 22,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: monoStyle(8, color: TB.green, spacing: 1.0),
          ),
          const SizedBox(height: 8),
          Text(
            widget.title,
            style: const TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.7,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            money(widget.amount, 'inr'),
            style: const TextStyle(color: TB.muted, fontSize: 11),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _note,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: _isAccept
                  ? 'Optional acceptance note'
                  : 'Explain what you delivered or what must change',
            ),
          ),
          if (_isAccept && widget.requireAck) ...[
            const SizedBox(height: 10),
            CheckboxListTile(
              value: _ack,
              onChanged: (value) => setState(() => _ack = value ?? false),
              contentPadding: EdgeInsets.zero,
              activeColor: TB.green,
              title: const Text(
                'I understand the verification is unresolved and want to release this milestone anyway.',
                style: TextStyle(
                  color: Color(0xFF7A6636),
                  fontSize: 10,
                  height: 1.4,
                ),
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),
          ],
          const SizedBox(height: 14),
          FilledButton(onPressed: _done, child: Text('$label ↗')),
        ],
      ),
    );
  }
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.api, required this.onSignOut});

  final ApiClient api;
  final Future<void> Function() onSignOut;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.profile();
  }

  Future<void> _reload() async {
    final future = widget.api.profile();
    setState(() => _future = future);
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return _ErrorView(error: snapshot.error.toString(), onRetry: _reload);
        }
        final user =
            ((snapshot.data?['user'] as Map?) ?? {}).cast<String, dynamic>();
        final seller = (user['sellerProfile'] as Map?)?.cast<String, dynamic>();
        final kyc = (seller?['kyc'] as Map?)?.cast<String, dynamic>();
        final role = (user['role'] as String?) ?? 'BUYER';
        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 28),
          children: [
            const Brand(),
            const PageHeader(
              eyebrow: 'YOUR ACCOUNT',
              title: 'Your corner\nof the record.',
              subtitle:
                  'Identity, payout readiness, and the rules you are agreeing to.',
            ),
            Container(
              padding: const EdgeInsets.all(17),
              decoration: BoxDecoration(
                color: TB.paper,
                border: Border.all(color: const Color(0xFFE2DAC9)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 53,
                    height: 53,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      color: TB.green,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      initials(user['name'] as String?),
                      style: monoStyle(13, color: TB.lime),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (user['name'] as String?) ?? 'TrustBridge member',
                          style: const TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.6,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          (user['email'] as String?) ?? '',
                          style: const TextStyle(color: TB.muted, fontSize: 10),
                        ),
                        const SizedBox(height: 7),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 4,
                          ),
                          color: TB.limeSoft,
                          child: Text(
                            role.toLowerCase(),
                            style: monoStyle(7.5, color: TB.green),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (role == 'SELLER' && seller != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: TB.paper,
                  border: Border.all(color: const Color(0xFFE2DAC9)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionLabel('SELLER IDENTITY'),
                    const SizedBox(height: 8),
                    _InfoRow(
                      label: 'KYC status',
                      value: (kyc?['kycStatus'] as String? ?? 'not started')
                          .replaceAll('_', ' ')
                          .toLowerCase(),
                    ),
                    _InfoRow(
                      label: 'Legal name',
                      value: (kyc?['legalName'] as String?) ?? 'Not provided',
                    ),
                    _InfoRow(
                      label: 'Payout account',
                      value:
                          '${kyc?['payoutBankName'] ?? 'Not linked'}${kyc?['payoutAccountLast4'] != null ? ' ending ${kyc!['payoutAccountLast4']}' : ''}',
                    ),
                    const SizedBox(height: 9),
                    OutlinedButton(
                      onPressed: () => openExternal(
                        context,
                        '${ApiClient.baseUrl}/seller/verify',
                      ),
                      child: Text(
                        kyc?['kycStatus'] == 'VERIFIED'
                            ? 'Review verification'
                            : 'Complete verification',
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 10),
            _LinkCard(
              label: 'WORKSPACE',
              links: [
                ('All deals', '${ApiClient.baseUrl}/app/deals'),
                ('Start a protected deal', '${ApiClient.baseUrl}/create'),
                ('WhatsApp referee', '${ApiClient.baseUrl}/demo/whatsapp'),
                ('Full verification workspace', '${ApiClient.baseUrl}/check'),
              ],
            ),
            const SizedBox(height: 10),
            _LinkCard(
              label: 'THE FINE PRINT',
              links: [
                ('Terms', '${ApiClient.baseUrl}/legal/terms'),
                ('Privacy', '${ApiClient.baseUrl}/legal/privacy'),
                ('Refunds & disputes', '${ApiClient.baseUrl}/legal/refunds'),
                ('Grievance', '${ApiClient.baseUrl}/legal/grievance'),
              ],
            ),
            const SizedBox(height: 17),
            OutlinedButton(
              onPressed: () async {
                await widget.onSignOut();
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF90452F),
              ),
              child: const Text('SIGN OUT'),
            ),
          ],
        );
      },
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFFECE4D5))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: TB.muted, fontSize: 10),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: TB.ink,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LinkCard extends StatelessWidget {
  const _LinkCard({required this.label, required this.links});

  final String label;
  final List<(String, String)> links;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: TB.paper,
        border: Border.all(color: const Color(0xFFE2DAC9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionLabel(label),
          const SizedBox(height: 7),
          ...links.map(
            (item) => Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFECE4D5))),
              ),
              child: ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                visualDensity: VisualDensity.compact,
                title: Text(
                  item.$1,
                  style: const TextStyle(color: TB.green, fontSize: 11),
                ),
                trailing: const Icon(
                  Icons.north_east,
                  size: 15,
                  color: TB.green,
                ),
                onTap: () => openExternal(context, item.$2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});

  final String error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 30, color: TB.muted),
            const SizedBox(height: 12),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: TB.muted,
                fontSize: 11,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 14),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}
