
# Guide to Handling File Downloads in an Android WebView

This guide provides the necessary native Android code to intercept `data:` URI downloads from a WebView and save them as files on the user's device. This is crucial for features like downloading a PDF statement.

## 1. Common Reasons for Failure on Android

- **WebView Limitation**: A standard WebView does not have a built-in file downloader like a desktop browser. Simply creating a download link (`<a download>`) will not work.
- **Permissions**: Modern Android versions (especially 10+) require specific permissions and approaches to write files to public storage (like the "Downloads" folder). You cannot directly write to the file system without proper permissions.
- **API Level Differences**: The method for saving files differs between older Android versions and newer ones (Android 10/Q and above) due to Scoped Storage.

## 2. The Solution: Intercepting Downloads

The solution is to listen for download requests within the WebView, grab the `data:` URI, decode it, and use Android's native file-saving mechanisms.

## 3. Android Implementation (Kotlin)

You'll need to modify the Activity that hosts your WebView.

### Step 3.1: Add Permissions to `AndroidManifest.xml`

Add the following permission to your `android/app/src/main/AndroidManifest.xml` file. This is still needed for older Android versions.

```xml
<manifest ...>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    ...
</manifest>
```

**Note**: For Android 10 and above, we will use the `MediaStore` API, which does not require this permission for saving files to standard collections like `Downloads`.

### Step 3.2: Set the Download Listener on the WebView

In your `MainActivity.kt` (or wherever your WebView is configured), set a `DownloadListener`.

```kotlin
// MainActivity.kt
import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.util.Base64
import android.webkit.DownloadListener
import android.webkit.URLUtil
import android.webkit.WebView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import java.io.File
import java.io.FileOutputStream
import java.util.regex.Pattern

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Assuming you have a WebView instance, e.g., from Capacitor's BridgeActivity
        val webView: WebView = findViewById(R.id.webview) // Or get it from your view hierarchy

        webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
            
            // Check if the URL is a data URI
            if (url.startsWith("data:")) {
                handleDataUrl(url)
            } else {
                // Handle regular URL downloads (optional)
                val request = DownloadManager.Request(Uri.parse(url))
                request.setMimeType(mimetype)
                request.addRequestHeader("User-Agent", userAgent)
                request.setDescription("Downloading file...")
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype))
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimetype))
                
                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)
                
                Toast.makeText(applicationContext, "Downloading File", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun handleDataUrl(url: String) {
        try {
            val dataUriPattern = Pattern.compile("data:(.*?);base64,(.*)")
            val matcher = dataUriPattern.matcher(url)
            if (!matcher.find()) {
                throw IllegalArgumentException("Not a valid data URI")
            }

            val mimeType = matcher.group(1) ?: "application/octet-stream"
            val base64Data = matcher.group(2) ?: ""
            val fileData = Base64.decode(base64Data, Base64.DEFAULT)

            // Guess a filename
            val extension = if (mimeType.equals("application/pdf", true)) "pdf" else "bin"
            val fileName = "download_${System.currentTimeMillis()}.$extension"

            // Save the file
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (!downloadsDir.exists()) {
                downloadsDir.mkdirs()
            }
            val file = File(downloadsDir, fileName)

            FileOutputStream(file).use { outputStream ->
                outputStream.write(fileData)
            }

            // Notify the user
            Toast.makeText(this, "File saved to Downloads/$fileName", Toast.LENGTH_LONG).show()

            // Optional: Notify media scanner
            val mediaScanIntent = android.content.Intent(android.content.Intent.ACTION_MEDIA_SCANNER_SCAN_FILE)
            mediaScanIntent.data = Uri.fromFile(file)
            sendBroadcast(mediaScanIntent)

        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "Failed to save file.", Toast.LENGTH_SHORT).show()
        }
    }
}
```

### Explanation of the Code:

1.  **`setDownloadListener`**: This is the key. We tell the WebView to notify our app whenever a "download" is triggered.
2.  **URL Check**: The listener receives the `url`. We check if it starts with `data:`. This is the signal from our web app.
3.  **`handleDataUrl` Function**:
    *   **Regex Parsing**: It uses a regular expression to parse the `data:` URI into its two main parts: the MIME type (e.g., `application/pdf`) and the Base64-encoded data.
    *   **Decoding**: The Base64 data is decoded back into its original binary form (`ByteArray`).
    *   **File Path**: We get the public "Downloads" directory. This is the standard place to save user-initiated downloads.
    *   **Saving**: A `FileOutputStream` is used to write the decoded byte array into a new file in the "Downloads" directory.
    *   **Notification**: A `Toast` message informs the user that the file has been saved and where to find it.

This approach is robust and respects the Android file system guidelines, ensuring that your PDF download feature will work reliably within the native app.
