use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

static QUITTING: AtomicBool = AtomicBool::new(false);

fn show_main_window(app: &tauri::AppHandle, focus_input: bool) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        if focus_input {
            let _ = app.emit("focus-quick-add", ());
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app, true);
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "显示 DeskList", true, None::<&str>)?;
            let quick_add = MenuItem::with_id(app, "quick-add", "快速添加", true, None::<&str>)?;
            let floating = MenuItem::with_id(app, "floating", "桌面悬浮窗", true, None::<&str>)?;
            let always_on_top = MenuItem::with_id(app, "always-on-top", "始终置顶", true, None::<&str>)?;
            let autostart = MenuItem::with_id(app, "autostart", "开机启动", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quick_add, &floating, &always_on_top, &autostart, &separator, &quit])?;

            TrayIconBuilder::with_id("desklist-tray")
                .icon(app.default_window_icon().expect("application icon missing").clone())
                .tooltip("DeskList")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app, false),
                    "quick-add" => show_main_window(app, true),
                    "floating" => { let _ = app.emit("tray-toggle-floating", ()); }
                    "always-on-top" => { let _ = app.emit("tray-toggle-always-on-top", ()); }
                    "autostart" => { let _ = app.emit("tray-toggle-autostart", ()); }
                    "quit" => { QUITTING.store(true, Ordering::SeqCst); app.exit(0); }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if matches!(event, TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } | TrayIconEvent::DoubleClick { button: MouseButton::Left, .. }) {
                        show_main_window(tray.app_handle(), false);
                    }
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if !QUITTING.load(Ordering::SeqCst) {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running DeskList");
}
