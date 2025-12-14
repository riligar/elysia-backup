// https://bun.com/docs/runtime/s3
// https://elysiajs.com/plugins/html
import { Elysia, t } from "elysia";
import { S3Client } from "bun";
import { CronJob } from "cron";
import { readdir, stat, readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { html } from "@elysiajs/html";

/**
 * Elysia Plugin for R2/S3 Backup with UI (using native Bun.s3)
 *
 * @param {Object} config
 * @param {string} config.bucket - The R2/S3 bucket name
 * @param {string} config.accessKeyId - R2/S3 Access Key ID
 * @param {string} config.secretAccessKey - R2/S3 Secret Access Key
 * @param {string} config.endpoint - R2/S3 Endpoint URL
 * @param {string} config.sourceDir - Local directory to backup
 * @param {string} [config.prefix] - Optional prefix for S3 keys (e.g. 'backups/')
 * @param {string} [config.cronSchedule] - Cron schedule expression
 * @param {boolean} [config.cronEnabled] - Whether the cron schedule is enabled
 * @param {string} [config.configPath] - Path to save runtime configuration (default: './backup-config.json')
 */
export const r2Backup = (initialConfig) => (app) => {
  // State to hold runtime configuration (allows UI updates)
  const configPath = initialConfig.configPath || "./backup-config.json";

  // Load saved config if exists
  let savedConfig = {};
  if (existsSync(configPath)) {
    try {
      // We use synchronous read here or just init with promise (but top level await is tricky in plugins depending on usage)
      // For simplicity in this context, we'll rely on the fact that this runs once on startup.
      // However, since we are in a function, we can't easily do async await at top level unless the plugin is async.
      // Elysia plugins can be async.
      // Using readFileSync for startup config loading to ensure it's ready.
      const fileContent = readFileSync(configPath, "utf-8");
      savedConfig = JSON.parse(fileContent);
      console.log("Loaded backup config from", configPath);
    } catch (e) {
      console.error("Failed to load backup config:", e);
    }
  }

  let config = { ...initialConfig, ...savedConfig };
  let backupJob = null;

  const getS3Client = () => {
    // Debug config (masked)
    console.log("S3 Config:", {
      bucket: config.bucket,
      endpoint: config.endpoint,
      accessKeyId: config.accessKeyId
        ? "***" + config.accessKeyId.slice(-4)
        : "missing",
      hasSecret: !!config.secretAccessKey,
    });

    return new S3Client({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      endpoint: config.endpoint,
      bucket: config.bucket,
      region: "auto",
      // R2 requires specific region handling or defaults.
      // Bun S3 defaults to us-east-1 which is usually fine for R2 if endpoint is correct.
    });
  };

  const uploadFile = async (filePath, rootDir, timestampPrefix) => {
    const s3 = getS3Client();
    const fileContent = await readFile(filePath);

    const relativePath = relative(rootDir, filePath);
    const dir = dirname(relativePath);
    const filename = relativePath.split("/").pop(); // or basename

    // Format: YYYY-MM-DD_HH-mm-ss_filename.ext (or ISO if not provided)
    const timestamp = timestampPrefix || new Date().toISOString();
    const newFilename = `${timestamp}_${filename}`;

    // Reconstruct path with new filename
    const finalPath = dir === "." ? newFilename : join(dir, newFilename);

    const key = config.prefix ? join(config.prefix, finalPath) : finalPath;

    console.log(`Uploading ${key}...`);

    // Bun.s3 API: s3.write(key, data)
    await s3.write(key, fileContent);
  };

  const processDirectory = async (dir, timestampPrefix) => {
    const files = await readdir(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        await processDirectory(fullPath, timestampPrefix);
      } else {
        // Filter by extension
        const allowedExtensions = config.extensions || [];
        const hasExtension = allowedExtensions.some((ext) =>
          file.endsWith(ext)
        );

        // Skip files that look like backups to prevent recursion/duplication
        // Matches: YYYY-MM-DD_HH-mm-ss_ OR ISOString_
        const timestampRegex =
          /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_/;
        if (timestampRegex.test(file)) {
          console.log(`Skipping backup-like file: ${file}`);
          continue;
        }

        if (allowedExtensions.length === 0 || hasExtension) {
          await uploadFile(fullPath, config.sourceDir, timestampPrefix);
        }
      }
    }
  };

  const setupCron = () => {
    if (backupJob) {
      backupJob.stop();
      backupJob = null;
    }

    if (config.cronSchedule && config.cronEnabled !== false) {
      console.log(`Setting up backup cron: ${config.cronSchedule}`);
      try {
        backupJob = new CronJob(
          config.cronSchedule,
          async () => {
            console.log("Running scheduled backup...");
            try {
              // Generate timestamp similar to manual run
              const now = new Date();
              const timestamp =
                now.getFullYear() +
                "-" +
                String(now.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(now.getDate()).padStart(2, "0") +
                "_" +
                String(now.getHours()).padStart(2, "0") +
                "-" +
                String(now.getMinutes()).padStart(2, "0") +
                "-" +
                String(now.getSeconds()).padStart(2, "0");

              await processDirectory(config.sourceDir, timestamp);
              console.log("Scheduled backup completed");
            } catch (e) {
              console.error("Scheduled backup failed:", e);
            }
          },
          null,
          true // start
        );
      } catch (e) {
        console.error("Invalid cron schedule:", e.message);
      }
    }
  };

  // Initialize cron
  setupCron();

  const listRemoteFiles = async () => {
    const s3 = getS3Client();
    // Bun.s3 list API
    // Returns a Promise that resolves to the list of files (or object with contents)
    // Based on Bun docs/behavior, list() returns an array of S3File-like objects or similar structure
    try {
      const response = await s3.list({ prefix: config.prefix || "" });
      // If response is array
      if (Array.isArray(response)) {
        return response.map((f) => ({
          Key: f.key || f.name, // Handle potential property names
          Size: f.size,
          LastModified: f.lastModified,
        }));
      }
      // If response has contents (AWS-like)
      if (response.contents) {
        return response.contents.map((f) => ({
          Key: f.key,
          Size: f.size,
          LastModified: f.lastModified,
        }));
      }
      console.log("Unknown list response structure:", response);
      return [];
    } catch (e) {
      console.error("Error listing files with Bun.s3:", e);
      return [];
    }
  };

  const restoreFile = async (key) => {
    const s3 = getS3Client();
    const file = s3.file(key);

    if (!(await file.exists())) {
      throw new Error(`File ${key} not found in bucket`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);

    // Determine local path
    // Remove prefix from key to get relative path
    const relativePath = config.prefix ? key.replace(config.prefix, "") : key;
    // Clean leading slashes if any
    const cleanRelative = relativePath.replace(/^[\/\\]/, "");

    // Extract directory and filename
    const dir = dirname(cleanRelative);
    const filename = cleanRelative.split("/").pop();

    // Strip timestamp prefix if present to restore original filename
    // Matches: YYYY-MM-DD_HH-mm-ss_ OR ISOString_
    const timestampRegex =
      /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_/;
    const originalFilename = filename.replace(timestampRegex, "");

    const finalLocalRelativePath =
      dir === "." ? originalFilename : join(dir, originalFilename);
    const localPath = join(config.sourceDir, finalLocalRelativePath);

    // Ensure directory exists
    await mkdir(dirname(localPath), { recursive: true });
    await writeFile(localPath, byteArray);
    return localPath;
  };

  const deleteFile = async (key) => {
    const s3 = getS3Client();
    // Bun S3 client delete
    await s3.delete(key);
  };

  const getJobStatus = () => {
    const isRunning = !!backupJob && config.cronEnabled !== false;
    let nextRun = null;
    if (isRunning && backupJob) {
      try {
        const nextDate = backupJob.nextDate();
        if (nextDate) {
          // cron returns Luxon DateTime, convert to JS Date for consistent ISO string
          nextRun = nextDate.toJSDate().toISOString();
        }
      } catch (e) {
        console.error("Error getting next date", e);
      }
    }
    return { isRunning, nextRun };
  };

  return app.use(html()).group("/backup", (app) =>
    app
      // API: Run Backup
      .post(
        "/api/run",
        async ({ body, set }) => {
          try {
            const { timestamp } = body || {};
            console.log(
              `Starting backup of ${config.sourceDir} to ${config.bucket} with timestamp ${timestamp}`
            );
            await processDirectory(config.sourceDir, timestamp);
            return {
              status: "success",
              message: "Backup completed successfully",
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            console.error("Backup failed:", error);
            set.status = 500;
            return { status: "error", message: error.message };
          }
        },
        {
          body: t.Optional(
            t.Object({
              timestamp: t.Optional(t.String()),
            })
          ),
        }
      )

      // API: List Files
      .get("/api/files", async ({ set }) => {
        try {
          const files = await listRemoteFiles();
          return {
            files: files.map((f) => ({
              key: f.Key,
              size: f.Size,
              lastModified: f.LastModified,
            })),
          };
        } catch (error) {
          set.status = 500;
          return { status: "error", message: error.message };
        }
      })

      // API: Restore File
      .post(
        "/api/restore",
        async ({ body, set }) => {
          try {
            const { key } = body;
            if (!key) throw new Error("Key is required");
            const localPath = await restoreFile(key);
            return { status: "success", message: `Restored to ${localPath}` };
          } catch (error) {
            set.status = 500;
            return { status: "error", message: error.message };
          }
        },
        {
          body: t.Object({
            key: t.String(),
          }),
        }
      )

      // API: Delete File
      .post(
        "/api/delete",
        async ({ body, set }) => {
          try {
            const { key } = body;
            if (!key) throw new Error("Key is required");
            await deleteFile(key);
            return { status: "success", message: `Deleted ${key}` };
          } catch (error) {
            set.status = 500;
            return { status: "error", message: error.message };
          }
        },
        {
          body: t.Object({
            key: t.String(),
          }),
        }
      )

      // API: Update Config
      .post(
        "/api/config",
        async ({ body }) => {
          // Handle extensions if passed as string
          let newConfig = { ...body };
          if (typeof newConfig.extensions === "string") {
            newConfig.extensions = newConfig.extensions
              .split(",")
              .map((e) => e.trim())
              .filter(Boolean);
          }
          config = { ...config, ...newConfig };

          // Persist config
          try {
            // Don't save secrets in plain text if possible, but for this simple tool we might have to
            // or just save the non-env parts.
            // For now, we save everything that overrides the defaults.
            await writeFile(configPath, JSON.stringify(config, null, 2));
          } catch (e) {
            console.error("Failed to save config:", e);
          }

          setupCron(); // Restart cron with new config
          return {
            status: "success",
            config: { ...config, secretAccessKey: "***" },
            jobStatus: getJobStatus(),
          };
        },
        {
          body: t.Object({
            bucket: t.String(),
            endpoint: t.String(),
            sourceDir: t.String(),
            prefix: t.Optional(t.String()),
            extensions: t.Optional(t.Union([t.Array(t.String()), t.String()])), // Allow array or comma-separated string
            accessKeyId: t.String(),
            secretAccessKey: t.String(),
            cronSchedule: t.Optional(t.String()),
            cronEnabled: t.Optional(t.Boolean()),
          }),
        }
      )

      // UI: Dashboard
      .get("/", ({ set }) => {
        set.headers["Content-Type"] = "text/html; charset=utf8";
        const jobStatus = getJobStatus();
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R2 Backup Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Montserrat', 'sans-serif'],
                    },
                    colors: {
                        gray: {
                            50: '#F9FAFB',
                            100: '#F3F4F6',
                            200: '#E5E7EB',
                            300: '#D1D5DB',
                            400: '#9CA3AF',
                            500: '#6B7280',
                            600: '#4B5563',
                            700: '#374151',
                            800: '#1F2937',
                            900: '#111827',
                        }
                    }
                }
            }
        }
    </script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen p-12 antialiased selection:bg-gray-900 selection:text-white">
    <div class="max-w-5xl mx-auto" x-data="backupApp()">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
                <h6 class="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                    System Administration
                </h6>
                <h1 class="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    Backup Manager
                </h1>
            </div>
            
            <!-- Tabs -->
            <div class="flex p-1 bg-gray-200/50 rounded-xl">
                <button @click="activeTab = 'dashboard'; $nextTick(() => lucide.createIcons())" 
                    :class="activeTab === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                    class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2">
                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                    Overview
                </button>
                <button @click="activeTab = 'files'; fetchFiles()" 
                    :class="activeTab === 'files' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                    class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2">
                    <i data-lucide="folder-open" class="w-4 h-4"></i>
                    Files & Restore
                </button>
                <button @click="activeTab = 'settings'; $nextTick(() => lucide.createIcons())" 
                    :class="activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                    class="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2">
                    <i data-lucide="settings" class="w-4 h-4"></i>
                    Settings
                </button>
            </div>
        </div>

        <!-- Dashboard Tab -->
        <div x-show="activeTab === 'dashboard'" class="space-y-12" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0">
            
            <!-- Status Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div class="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
                        <i data-lucide="folder" class="w-4 h-4"></i>
                        Local Source
                    </div>
                    <div class="text-gray-900 font-semibold truncate" x-text="config.sourceDir"></div>
                </div>
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div class="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
                        <i data-lucide="cloud" class="w-4 h-4"></i>
                        Target Bucket
                    </div>
                    <div class="text-gray-900 font-semibold truncate" x-text="config.bucket"></div>
                </div>
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div class="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        Last Backup
                    </div>
                    <div class="text-gray-900 font-semibold" x-text="lastBackup || 'No backup recorded'"></div>
                </div>
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                    <div class="text-gray-500 text-sm font-medium mb-3 flex items-center gap-2">
                        <i data-lucide="calendar-clock" class="w-4 h-4"></i>
                        Schedule Status
                    </div>
                    
                    <template x-if="cronStatus.isRunning">
                        <div class="flex items-center gap-3">
                            <span class="relative flex h-2.5 w-2.5 shrink-0" title="Active">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            <div class="flex items-baseline gap-1.5 min-w-0">
                                <span class="text-gray-900 font-bold text-xs font-mono truncate" x-text="new Date(cronStatus.nextRun).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })"></span>
                            </div>
                        </div>
                    </template>

                    <template x-if="!cronStatus.isRunning">
                        <div class="flex items-center gap-3">
                            <span class="h-2.5 w-2.5 rounded-full bg-gray-300 shrink-0" title="Stopped"></span>
                            <span class="text-gray-400 text-sm italic">Scheduler paused</span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Action Area -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                <div class="p-10 flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400">
                        <i data-lucide="save" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Trigger Manual Backup</h3>
                    <p class="text-gray-500 max-w-md mb-8 leading-relaxed">Initiate a backup of your local directory to the configured R2 bucket. This will upload all files recursively.</p>
                    
                    <button 
                        @click="runBackup()" 
                        :disabled="loading"
                        class="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-gray-900 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70 disabled:cursor-not-allowed">
                        <span x-show="!loading" class="flex items-center gap-2">
                            <i data-lucide="play-circle" class="w-5 h-5"></i>
                            Start Backup Process
                        </span>
                        <span x-show="loading" class="flex items-center gap-2">
                            <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
                            Processing...
                        </span>
                    </button>
                </div>
                
                <!-- Logs -->
                <div class="bg-gray-50 border-t border-gray-100 p-8">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Activity Log</h4>
                    <div class="space-y-3">
                        <template x-for="log in logs" :key="log.id">
                            <div class="flex items-start gap-4 text-sm">
                                <span class="font-mono text-xs text-gray-400 mt-0.5" x-text="log.time"></span>
                                <div class="flex items-center gap-2">
                                    <i :data-lucide="log.type === 'error' ? 'alert-circle' : 'info'" 
                                       :class="log.type === 'error' ? 'text-red-600' : 'text-gray-400'"
                                       class="w-4 h-4"></i>
                                    <span :class="log.type === 'error' ? 'text-red-600 font-medium' : 'text-gray-600'" x-text="log.message"></span>
                                </div>
                            </div>
                        </template>
                        <div x-show="logs.length === 0" class="text-gray-400 text-sm italic">No recent activity recorded.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Files Tab -->
        <div x-show="activeTab === 'files'" class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0">
            <div class="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i data-lucide="server" class="w-5 h-5 text-gray-400"></i>
                        Remote Files
                    </h2>
                    <p class="text-gray-500 text-sm mt-1">Files currently stored in your R2 bucket</p>
                </div>
                <button @click="fetchFiles()" class="text-gray-900 hover:text-gray-600 font-semibold text-sm transition-colors flex items-center gap-2">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    Refresh List
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="border-b border-gray-100">
                            <th class="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">File Key</th>
                            <th class="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Size</th>
                            <th class="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Modified</th>
                            <th class="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <template x-for="group in groups" :key="group.name">
                        <tbody class="divide-y divide-gray-50 border-b border-gray-100">
                            <!-- Folder Header -->
                            <tr class="bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors select-none" 
                                @click="group.expanded = !group.expanded; $nextTick(() => lucide.createIcons())">
                                <td colspan="4" class="px-8 py-3">
                                    <div class="flex items-center gap-3">
                                        <i :data-lucide="group.expanded ? 'folder-open' : 'folder'" class="w-5 h-5 text-gray-400"></i>
                                        <span class="font-bold text-gray-700 text-sm" x-text="formatDateHeader(group.name)"></span>
                                        <span class="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full" x-text="group.files.length"></span>
                                    </div>
                                </td>
                            </tr>

                            <!-- Files in Group -->
                            <template x-for="file in group.files" :key="file.key">
                                <tr x-show="group.expanded" class="hover:bg-gray-50 transition-colors duration-150 group bg-white">
                                    <td class="px-8 py-5 font-medium text-gray-900 text-sm pl-12" x-text="file.key"></td>
                                    <td class="px-8 py-5 text-gray-500 text-sm" x-text="formatBytes(file.size)"></td>
                                    <td class="px-8 py-5 text-gray-500 text-sm" x-text="new Date(file.lastModified).toLocaleString()"></td>
                                    <td class="px-8 py-5 text-right">
                                        <div class="flex justify-end gap-3 items-center">
                                            <!-- Restore Button -->
                                            <button 
                                                x-data="holdButton(() => restoreFile(file.key))"
                                                @mousedown="start()" @touchstart.prevent="start()"
                                                @mouseup="stop()" @mouseleave="stop()" @touchend="stop()"
                                                class="relative overflow-hidden px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors select-none"
                                                title="Hold 3s to Restore"
                                            >
                                                <div class="absolute inset-0 bg-blue-200/50 origin-left transition-all duration-0 ease-linear" :style="'width: ' + progress + '%'"></div>
                                                <span class="relative z-10 flex items-center gap-2">
                                                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                                                    <span x-text="progress > 0 ? 'Hold...' : 'Restore'"></span>
                                                </span>
                                            </button>

                                            <!-- Delete Button -->
                                            <button 
                                                x-data="holdButton(() => deleteFile(file.key))"
                                                @mousedown="start()" @touchstart.prevent="start()"
                                                @mouseup="stop()" @mouseleave="stop()" @touchend="stop()"
                                                class="relative overflow-hidden px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 transition-colors select-none"
                                                title="Hold 3s to Delete"
                                            >
                                                <div class="absolute inset-0 bg-red-200/50 origin-left transition-all duration-0 ease-linear" :style="'width: ' + progress + '%'"></div>
                                                <span class="relative z-10 flex items-center gap-2">
                                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                                    <span x-text="progress > 0 ? 'Hold...' : 'Delete'"></span>
                                                </span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </template>
                    
                    <!-- Empty State (outside the loop) -->
                    <tbody x-show="groups.length === 0">
                        <tr>
                            <td colspan="4" class="px-8 py-16 text-center">
                                <div class="flex flex-col items-center justify-center">
                                    <span x-show="!loadingFiles" class="text-gray-500 font-medium flex flex-col items-center gap-2">
                                        <i data-lucide="inbox" class="w-8 h-8 text-gray-300"></i>
                                        No files found in bucket
                                    </span>
                                    <span x-show="loadingFiles" class="text-gray-500 font-medium animate-pulse flex flex-col items-center gap-2">
                                        <i data-lucide="loader" class="w-8 h-8 animate-spin text-gray-300"></i>
                                        Loading remote files...
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Settings Tab -->
        <div x-show="activeTab === 'settings'" class="max-w-3xl mx-auto" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-2"
             x-transition:enter-end="opacity-100 translate-y-0">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10">
                <h2 class="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                    <i data-lucide="sliders" class="w-5 h-5"></i>
                    Configuration
                </h2>
                <form @submit.prevent="saveConfig" class="space-y-8">
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Endpoint URL</label>
                            <input type="text" x-model="configForm.endpoint" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Bucket Name</label>
                                <input type="text" x-model="configForm.bucket" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Prefix (Folder)</label>
                                <input type="text" x-model="configForm.prefix" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Source Directory (Local)</label>
                            <input type="text" x-model="configForm.sourceDir" readonly class="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed focus:outline-none font-medium">
                            <p class="text-xs text-gray-400 mt-1">Defined in server configuration</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Allowed Extensions (comma separated)</label>
                            <input type="text" x-model="configForm.extensions" placeholder=".db, .sqlite" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Cron Schedule</label>
                            <div class="flex gap-4 items-center">
                                <div class="relative flex-grow">
                                    <input type="text" x-model="configForm.cronSchedule" placeholder="0 0 * * *" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                        <a href="https://crontab.guru/" target="_blank" class="underline hover:text-gray-800">Help</a>
                                    </div>
                                </div>
                                <div class="flex gap-2 shrink-0">
                                    <button 
                                        type="button"
                                        @click="configForm.cronEnabled = true; saveConfig()"
                                        :class="configForm.cronEnabled !== false ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                                        class="px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                                    >
                                        <i data-lucide="play" class="w-4 h-4"></i>
                                        Start
                                    </button>
                                    <button 
                                        type="button"
                                        @click="configForm.cronEnabled = false; saveConfig()"
                                        :class="configForm.cronEnabled === false ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                                        class="px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                                    >
                                        <i data-lucide="square" class="w-4 h-4"></i>
                                        Stop
                                    </button>
                                </div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">Format: Minute Hour Day Month DayOfWeek (e.g., "0 0 * * *" for daily at midnight)</p>
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Access Key ID</label>
                                <input type="text" x-model="configForm.accessKeyId" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Secret Access Key</label>
                                <input type="password" x-model="configForm.secretAccessKey" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all font-medium">
                            </div>
                        </div>
                    </div>
                    
                    <div class="pt-4 flex justify-end">
                        <button type="submit" class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2">
                            <i data-lucide="save" class="w-4 h-4"></i>
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('holdButton', (action) => ({
                progress: 0,
                interval: null,
                start() {
                    this.progress = 0
                    // 3 seconds = 3000ms. Update every 30ms. 100 steps.
                    // 100% / 100 steps = 1% per step.
                    this.interval = setInterval(() => {
                        this.progress += 1
                        if (this.progress >= 100) {
                            this.trigger()
                        }
                    }, 30)
                },
                stop() {
                    clearInterval(this.interval)
                    this.progress = 0
                },
                trigger() {
                    this.stop()
                    action()
                }
            }))
        })

        function backupApp() {
            return {
                activeTab: 'dashboard',
                loading: false,
                loadingFiles: false,
                lastBackup: null,
                files: [],
                groups: [],
                logs: [],
                config: ${JSON.stringify(config)},
                cronStatus: ${JSON.stringify(jobStatus)},
                configForm: { ...${JSON.stringify(config)} },

                init() {
                    // Initial load if needed
                    this.$nextTick(() => {
                        lucide.createIcons()
                    })
                },

                addLog(message, type = 'info') {
                    this.logs.unshift({
                        id: Date.now(),
                        message,
                        type,
                        time: new Date().toLocaleTimeString()
                    })
                    this.$nextTick(() => lucide.createIcons())
                },

                formatBytes(bytes, decimals = 2) {
                    if (!+bytes) return '0 Bytes'
                    const k = 1024
                    const dm = decimals < 0 ? 0 : decimals
                    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB']
                    const i = Math.floor(Math.log(bytes) / Math.log(k))
                    return \`\${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} \${sizes[i]}\`
                },

                formatDateHeader(dateStr) {
                    if (dateStr === 'Others') return 'Others';
                    // dateStr is YYYY-MM-DD
                    // Create date object treating the string as local time components to avoid timezone shifts
                    const [y, m, d] = dateStr.split('-').map(Number);
                    const date = new Date(y, m - 1, d);
                    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                },

                async runBackup() {
                    this.loading = true
                    
                    // Generate local timestamp: YYYY-MM-DD_HH-mm-ss
                    const now = new Date()
                    const timestamp = now.getFullYear() + '-' +
                        String(now.getMonth() + 1).padStart(2, '0') + '-' +
                        String(now.getDate()).padStart(2, '0') + '_' +
                        String(now.getHours()).padStart(2, '0') + '-' +
                        String(now.getMinutes()).padStart(2, '0') + '-' +
                        String(now.getSeconds()).padStart(2, '0')

                    try {
                        const res = await fetch('/backup/api/run', { 
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ timestamp })
                        })
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.lastBackup = new Date().toLocaleString()
                            this.addLog('Backup completed successfully', 'success')
                            this.fetchFiles() // Refresh file list
                        } else {
                            throw new Error(data.message)
                        }
                    } catch (err) {
                        this.addLog('Backup failed: ' + err.message, 'error')
                    } finally {
                        this.loading = false
                    }
                },

                async fetchFiles() {
                    this.loadingFiles = true
                    try {
                        const res = await fetch('/backup/api/files')
                        const data = await res.json()
                        if (data.files) {
                            // 1. Sort files by Key Descending (Newest first)
                            const sortedFiles = data.files.sort((a, b) => b.key.localeCompare(a.key));
                            
                            // 2. Group by Date
                            const groupsMap = {};
                            sortedFiles.forEach(file => {
                                // Extract YYYY-MM-DD from the filename (handles prefixes like 'backups/2025-...')
                                // Looks for YYYY-MM-DD followed by underscore or T (for ISO)
                                // Note: Backslashes must be double-escaped in this server-side template string
                                const match = file.key.match(/(?:^|\\/)(\\d{4}-\\d{2}-\\d{2})[_T]/);
                                const dateKey = match ? match[1] : 'Others';
                                
                                if (!groupsMap[dateKey]) {
                                    groupsMap[dateKey] = [];
                                }
                                groupsMap[dateKey].push(file);
                            });

                            // 3. Convert to array and sort groups descending
                            this.groups = Object.keys(groupsMap)
                                .sort()
                                .reverse()
                                .map((dateKey, index) => ({
                                    name: dateKey,
                                    files: groupsMap[dateKey],
                                    expanded: false // Start with all folders collapsed
                                }));

                            this.$nextTick(() => lucide.createIcons())
                        }
                    } catch (err) {
                        this.addLog('Failed to fetch files: ' + err.message, 'error')
                    } finally {
                        this.loadingFiles = false
                    }
                },

                async restoreFile(key) {
                    // Removed confirm dialog in favor of hold button
                    try {
                        const res = await fetch('/backup/api/restore', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key })
                        })
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.addLog(data.message, 'success')
                        } else {
                            throw new Error(data.message)
                        }
                    } catch (err) {
                        this.addLog('Restore failed: ' + err.message, 'error')
                    }
                },

                async deleteFile(key) {
                    try {
                        const res = await fetch('/backup/api/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key })
                        })
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.addLog(data.message, 'success')
                            this.fetchFiles() // Refresh list
                        } else {
                            throw new Error(data.message)
                        }
                    } catch (err) {
                        this.addLog('Delete failed: ' + err.message, 'error')
                    }
                },

                async saveConfig() {
                    try {
                        const res = await fetch('/backup/api/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.configForm)
                        })
                        const data = await res.json()
                        if (data.status === 'success') {
                            this.config = data.config
                            if (data.jobStatus) this.cronStatus = data.jobStatus
                            this.addLog('Configuration updated', 'success')
                            this.activeTab = 'dashboard'
                        }
                    } catch (err) {
                        this.addLog('Failed to save config: ' + err.message, 'error')
                    }
                }
            }
        }
    </script>
</body>
</html>
                `;
      })
  );
};
