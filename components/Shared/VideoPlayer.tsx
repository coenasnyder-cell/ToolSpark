import React from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface VideoPlayerProps {
  url: string;
  aspectRatio?: number;
}

export default function VideoPlayer({
  url,
  aspectRatio = 16 / 9,
}: VideoPlayerProps) {
  if (!url) return null;

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <View style={styles.unsupported}>
        <Text style={styles.unsupportedText}>
          Unsupported video URL
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { aspectRatio }]}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtu.be')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
  }

  // Loom
  if (url.includes('loom.com')) {
    const videoId = url.split('/share/')[1]?.split('?')[0];
    if (videoId) {
      return `https://www.loom.com/embed/${videoId}`;
    }
  }

  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  unsupported: {
    padding: Layout.md,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
  },
  unsupportedText: {
    fontSize: Typography.sm,
    color: Colors.text3,
  },
});