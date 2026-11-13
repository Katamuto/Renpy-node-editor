// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::thread;
use tauri::{AppHandle, Emitter};

#[derive(Clone, serde::Serialize)]
struct LogLine {
    line: String,
    err: bool,
}

// Finds the Ren'Py launcher script/executable inside an SDK folder.
fn renpy_exe(sdk: &str) -> Result<PathBuf, String> {
    let dir = PathBuf::from(sdk);
    let exe = if cfg!(target_os = "windows") { dir.join("renpy.exe") } else { dir.join("renpy.sh") };
    if exe.exists() {
        Ok(exe)
    } else {
        Err(format!("This folder does not look like a Ren'Py SDK: {} was not found.", exe.display()))
    }
}

#[tauri::command]
fn check_sdk(sdk: String) -> Result<String, String> {
    renpy_exe(&sdk).map(|p| p.display().to_string())
}

// Starts the game: <sdk>/renpy.sh <project> [--warp script.rpy:LINE]. Output is streamed back as "renpy-log" events.
#[tauri::command]
fn launch_renpy(app: AppHandle, sdk: String, project: String, warp: Option<String>) -> Result<(), String> {
    let exe = renpy_exe(&sdk)?;
    let mut cmd = Command::new(&exe);
    cmd.arg(&project);
    if let Some(w) = warp {
        cmd.arg("--warp").arg(w);
    }
    cmd.current_dir(&sdk).stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = cmd.spawn().map_err(|e| format!("Could not start {}: {}", exe.display(), e))?;

    let stream = |reader: Box<dyn std::io::Read + Send>, err: bool, app: AppHandle| {
        thread::spawn(move || {
            for line in BufReader::new(reader).lines().flatten() {
                let _ = app.emit("renpy-log", LogLine { line, err });
            }
        });
    };
    if let Some(o) = child.stdout.take() { stream(Box::new(o), false, app.clone()); }
    if let Some(e) = child.stderr.take() { stream(Box::new(e), true, app.clone()); }
    thread::spawn(move || {
        let code = child.wait().ok().and_then(|s| s.code()).unwrap_or(-1);
        let _ = app.emit("renpy-exit", code);
    });
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![check_sdk, launch_renpy])
        .run(tauri::generate_context!())
        .expect("error while running the editor");
}
