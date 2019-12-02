import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { Audio } from "expo-av";
import * as Permissions from "expo-permissions";
import * as FileSystem from "expo-file-system";

let _recording = null;
let _sound = null;

export default function App() {
  const [isRecording, setRecording] = useState(false);
  const [isPlaying, setPlaying] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [samples, setSamples] = useState([]);
  const [havePermission, setPermission] = useState(false);
  useEffect(() => {
    askPermission();
  }, []);

  const askPermission = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    setPermission(response.status === "granted");
  };
  const startRecording = async () => {
    setLoading(true);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true
      });

      const recording = new Audio.Recording();
      console.log("preparing recorder");
      await recording.prepareToRecordAsync(
        JSON.parse(JSON.stringify(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY))
      );
      console.log("recorder prepared");
      await recording.startAsync();
      setRecording(true);
      _recording = recording;
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  const stopRecording = async () => {
    setLoading(true);
    await _recording.stopAndUnloadAsync();
    setRecording(false);
    const info = await FileSystem.getInfoAsync(_recording.getURI());
    setSamples(prevSamples => [
      ...prevSamples,
      { recording: _recording, info }
    ]);
    setLoading(false);
  };

  const play = async recording => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true
    });

    const { sound, status } = await recording.createNewLoadedSoundAsync();
    await sound.playAsync();
    setPlaying(true);
  };

  return (
    <View style={styles.container}>
      {!havePermission && (
        <Button
          title="Allow Soundbored to use your microphone!"
          onPress={askPermission}
        />
      )}
      {samples.map((sample, i) => (
        <Button
          key={String(i + 1)}
          disabled={isLoading || isRecording}
          title={String(i + 1)}
          onPress={() => play(sample.recording)}
        />
      ))}
      <Button
        disabled={isLoading}
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? stopRecording : startRecording}
      />

      {/* <Button title={isPlaying ? "Pause" : "Play"} onPress={handlePressPlay} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});
