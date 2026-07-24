"use client";

import { useLayoutEffect } from "react";
import type { AppLocale } from "../i18n/config";
import { dictionaries } from "../i18n/dictionaries";

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = ["placeholder", "aria-label", "title"];

// A small runtime safety net for strings introduced by client-only experiences
// (header popovers, install prompts and interpolated greetings). These do not
// appear as complete text nodes during the initial server render.
const runtimeTranslations: Partial<Record<AppLocale, Record<string, string>>> = {
  "en-US": { "Chào,": "Hello,", "Tải app": "Get the app", "Cài miễn phí": "Install free", "Đang hoạt động": "Active", "Mở khóa": "Unlock", "Tài khoản của tôi": "My account", "Chuyển hồ sơ": "Switch profile", "Đặc quyền VIP": "VIP benefits", "Tham gia VIP": "Join VIP", "Quản lý gói VIP": "Manage VIP plan", "Mã ưu đãi": "Promo code", "Cài ngay": "Install now" },
  "fr-FR": { "Chào,": "Bonjour,", "Tải app": "Télécharger l’app", "Cài miễn phí": "Installation gratuite", "Đang hoạt động": "Actif", "Mở khóa": "Débloquer", "Tài khoản của tôi": "Mon compte", "Chuyển hồ sơ": "Changer de profil", "Đặc quyền VIP": "Avantages VIP", "Tham gia VIP": "Rejoindre VIP", "Quản lý gói VIP": "Gérer le forfait VIP", "Mã ưu đãi": "Code promo", "Cài ngay": "Installer" },
  "ja-JP": { "Chào,": "こんにちは、", "Tải app": "アプリを入手", "Cài miễn phí": "無料インストール", "Đang hoạt động": "有効", "Mở khóa": "ロック解除", "Tài khoản của tôi": "マイアカウント", "Chuyển hồ sơ": "プロフィール切替", "Đặc quyền VIP": "VIP特典", "Tham gia VIP": "VIPに参加", "Quản lý gói VIP": "VIPプラン管理", "Mã ưu đãi": "プロモコード", "Cài ngay": "今すぐインストール" },
  "ko-KR": { "Chào,": "안녕하세요,", "Tải app": "앱 다운로드", "Cài miễn phí": "무료 설치", "Đang hoạt động": "활성", "Mở khóa": "잠금 해제", "Tài khoản của tôi": "내 계정", "Chuyển hồ sơ": "프로필 전환", "Đặc quyền VIP": "VIP 혜택", "Tham gia VIP": "VIP 가입", "Quản lý gói VIP": "VIP 요금제 관리", "Mã ưu đãi": "프로모션 코드", "Cài ngay": "지금 설치" },
  "zh-CN": { "Chào,": "你好，", "Tải app": "下载应用", "Cài miễn phí": "免费安装", "Đang hoạt động": "已启用", "Mở khóa": "解锁", "Tài khoản của tôi": "我的账户", "Chuyển hồ sơ": "切换资料", "Đặc quyền VIP": "VIP权益", "Tham gia VIP": "加入VIP", "Quản lý gói VIP": "管理VIP方案", "Mã ưu đãi": "优惠码", "Cài ngay": "立即安装" },
};

function translateValue(value: string, locale: AppLocale) {
  if (locale === "vi-VN") return value;
  const dictionary = dictionaries[locale];
  const runtime = runtimeTranslations[locale];
  if (runtime?.[value]) return runtime[value];
  const exact = dictionary[value];
  if (exact) return exact;
  return Object.entries(dictionary)
    .filter(([source]) => source.length >= 4 && value.includes(source))
    .sort(([left], [right]) => right.length - left.length)
    .reduce((translated, [source, target]) => translated.replaceAll(source, target), value);
}

function translateTextNode(node: Text, locale: AppLocale) {
  const parent = node.parentElement;
  if (!parent || parent.closest("script, style, code, pre, [translate='no'], [data-no-translate]")) return;
  const source = originalText.get(node) ?? node.nodeValue ?? "";
  if (!originalText.has(node)) originalText.set(node, source);
  const trimmed = source.trim();
  if (!trimmed) return;
  const translated = translateValue(trimmed, locale);
  const leading = source.slice(0, source.indexOf(trimmed));
  const trailing = source.slice(source.indexOf(trimmed) + trimmed.length);
  const next = `${leading}${translated}${trailing}`;
  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateElement(element: Element, locale: AppLocale) {
  if (element.closest("[translate='no'], [data-no-translate]")) return;
  let originals = originalAttributes.get(element);
  if (!originals) {
    originals = new Map();
    originalAttributes.set(element, originals);
  }
  for (const attribute of translatedAttributes) {
    const current = element.getAttribute(attribute);
    if (current === null) continue;
    if (!originals.has(attribute)) originals.set(attribute, current);
    const source = originals.get(attribute) ?? current;
    const translated = translateValue(source, locale);
    if (current !== translated) element.setAttribute(attribute, translated);
  }
}

function translateTree(root: Node, locale: AppLocale) {
  if (root.nodeType === Node.TEXT_NODE) translateTextNode(root as Text, locale);
  if (root.nodeType === Node.ELEMENT_NODE) translateElement(root as Element, locale);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text, locale);
    else translateElement(node as Element, locale);
    node = walker.nextNode();
  }
}

export function GlobalTranslator({ locale }: { locale: AppLocale }) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    translateTree(document.body, locale);
    document.body.dataset.localeReady = "true";
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateTextNode(mutation.target as Text, locale);
        for (const node of mutation.addedNodes) translateTree(node, locale);
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);
  return null;
}
