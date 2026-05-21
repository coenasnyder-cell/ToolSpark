import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import YoutubeIframe from 'react-native-youtube-iframe';
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
  const { width } = useWindowDimensions();

  if (!url) return null;

  const youtubeId = getYoutubeId(url);
  if (youtubeId) {
    return (
      <View style={styles.container}>
        <YoutubeIframe
          videoId={youtubeId}
          width={width}
          height={width / aspectRatio}
        />
      </View>
    );
  }

  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) {
    return (
      <View style={styles.unsupported}>
        <Text style={styles.unsupportedText}>Unsupported video URL</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { aspectRatio }]}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        onShouldStartLoadWithRequest={(request) => {
          if (request.url === embedUrl) return true;
          if (request.url.startsWith('https://')) {
            Linking.openURL(request.url);
            return false;
          }
          return true;
        }}
      />
    </View>
  );
}

function getYoutubeId(url: string): string | null {
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) return null;
  const id = url.includes('youtu.be')
    ? url.split('youtu.be/')[1]?.split('?')[0]
    : url.split('v=')[1]?.split('&')[0];
  return id || null;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  if (url.includes('loom.com')) {
    const videoId = url.split('/share/')[1]?.split('?')[0];
    if (videoId) return `https://www.loom.com/embed/${videoId}`;
  }

  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (videoId) return `https://player.vimeo.com/video/${videoId}`;
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