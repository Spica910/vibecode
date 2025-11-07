package com.vibecode.modules;

import android.os.Build;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class ShellModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "ShellModule";
    private Process currentProcess;
    private OutputStream outputStream;
    private Thread outputThread;
    private boolean isRunning = false;

    public ShellModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void executeCommand(String command, String cwd, Promise promise) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder();

            // Set shell based on Android version
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                processBuilder.command("sh", "-c", command);
            } else {
                processBuilder.command("/system/bin/sh", "-c", command);
            }

            // Set working directory
            if (cwd != null && !cwd.isEmpty()) {
                File workingDir = new File(cwd);
                if (workingDir.exists() && workingDir.isDirectory()) {
                    processBuilder.directory(workingDir);
                }
            }

            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();

            // Read output
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );

            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();

            WritableMap result = Arguments.createMap();
            result.putString("output", output.toString());
            result.putInt("exitCode", exitCode);
            result.putString("error", exitCode != 0 ? "Command failed" : null);

            promise.resolve(result);

        } catch (IOException | InterruptedException e) {
            promise.reject("SHELL_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startInteractiveShell(String cwd, Promise promise) {
        try {
            if (isRunning) {
                promise.reject("SHELL_RUNNING", "Shell is already running");
                return;
            }

            ProcessBuilder processBuilder = new ProcessBuilder();
            processBuilder.command("sh");

            if (cwd != null && !cwd.isEmpty()) {
                File workingDir = new File(cwd);
                if (workingDir.exists() && workingDir.isDirectory()) {
                    processBuilder.directory(workingDir);
                }
            }

            processBuilder.redirectErrorStream(true);
            currentProcess = processBuilder.start();
            outputStream = currentProcess.getOutputStream();
            isRunning = true;

            // Start output reading thread
            startOutputThread();

            promise.resolve(true);

        } catch (IOException e) {
            promise.reject("SHELL_START_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void writeToShell(String input, Promise promise) {
        try {
            if (!isRunning || outputStream == null) {
                promise.reject("SHELL_NOT_RUNNING", "Shell is not running");
                return;
            }

            outputStream.write((input + "\n").getBytes());
            outputStream.flush();
            promise.resolve(true);

        } catch (IOException e) {
            promise.reject("SHELL_WRITE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopShell(Promise promise) {
        try {
            if (currentProcess != null) {
                currentProcess.destroy();
                currentProcess = null;
            }
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
            isRunning = false;

            promise.resolve(true);

        } catch (IOException e) {
            promise.reject("SHELL_STOP_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void checkCommand(String command, Promise promise) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder();
            processBuilder.command("which", command);
            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );

            String path = reader.readLine();
            int exitCode = process.waitFor();

            WritableMap result = Arguments.createMap();
            result.putBoolean("exists", exitCode == 0 && path != null);
            result.putString("path", path);

            promise.resolve(result);

        } catch (IOException | InterruptedException e) {
            promise.reject("CHECK_ERROR", e.getMessage());
        }
    }

    private void startOutputThread() {
        outputThread = new Thread(() -> {
            try {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(currentProcess.getInputStream())
                );

                String line;
                while (isRunning && (line = reader.readLine()) != null) {
                    sendEvent("onShellOutput", line);
                }

            } catch (IOException e) {
                sendEvent("onShellError", e.getMessage());
            }
        });
        outputThread.start();
    }

    private void sendEvent(String eventName, String data) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, data);
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("SHELL_PATH", "/system/bin/sh");
        return constants;
    }
}
