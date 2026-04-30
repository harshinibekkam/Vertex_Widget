function executeWidgetCode() {
  console.log("🚀 Widget script started");

  require(["DS/PlatformAPI/PlatformAPI"], function (API) {
    var topicName = "3DXVertex.stream";
    var sub;

    sub = API.subscribe(topicName, function (data) {
      //Do the work ...
      console.log(
        "Received from: ",
        data.sender,
        "width the following message: ",
        data.messsage,
      );
      console.log("Data:", data);
      myWidget.STREAM_KEY = data.streamkey;
      myWidget.CLIENT_ID = data.clientid;

     if(data.streamkey != null){

    document.querySelector("h1").style.display = "none";

    const box = document.getElementById("cornerBox");
    box.textContent = data.objectDisplayName;

    // ✅ ADD THIS LINE (your requirement)
    const nameEl = document.getElementById("objectName");
    if (nameEl) {
        nameEl.textContent = data.objectDisplayName || "No Name";
    }

    myWidget.loadViewer();
}
      

      // Unsubscribing sub to avoid getting more messages
      // API.unsubscribe(sub);
    });
    var myWidget = {
      // STREAM_KEY: "0bWDdtbttgIVk-yiSgzQ-6GUxyM0xifVWz2b",
      //CLIENT_ID: "08CEF7AE6E675F48D2C802AC0E6AFD183CC95553AA6889F032DD29AB070E40C0",

      selectedItemId: null,

      loadVertexScripts: function () {
        return new Promise((resolve) => {
          if (window.vertexLoaded) {
            resolve();
            return;
          }

          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href =
            "https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/viewer/viewer.css";
          document.head.appendChild(link);

          const script = document.createElement("script");
          script.type = "module";
          script.innerHTML = `
                        import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/esm/loader.js';
                        window.defineVertex = async () => {
                            await defineCustomElements(window);
                        };
                    `;
          document.body.appendChild(script);

          setTimeout(async () => {
            if (window.defineVertex) {
              await window.defineVertex();
              window.vertexLoaded = true;
            }
            resolve();
          }, 500);
        });
      },

      loadViewer: async function () {
        const viewer = document.getElementById("vertexViewer");

        if (!viewer) {
          console.error("❌ Viewer not found");
          return;
        }

        try {
          await myWidget.loadVertexScripts();
          await customElements.whenDefined("vertex-viewer");

          await viewer.load(`urn:vertex:stream-key:${myWidget.STREAM_KEY}`);

          myWidget.enableSelection(viewer);
        } catch (e) {
          console.error("❌ Load error:", e);
        }
      },

      enableSelection: function (viewer) {
        viewer.addEventListener("tap", async (event) => {
          const scene = await viewer.scene();
          const raycaster = scene.raycaster();
          const result = await raycaster.hitItems(event.detail.position);

          const [hit] = result.hits;

          if (hit) {
            const itemId = hit.itemId?.hex;

            await scene
              .items((op) => [
                ...(myWidget.selectedItemId
                  ? [
                      op
                        .where((q) => q.withItemId(myWidget.selectedItemId))
                        .deselect(),
                    ]
                  : []),
                op.where((q) => q.withItemId(itemId)).select(),
              ])
              .execute();

            myWidget.selectedItemId = itemId;
          } else if (myWidget.selectedItemId) {
            await scene
              .items((op) => [
                op
                  .where((q) => q.withItemId(myWidget.selectedItemId))
                  .deselect(),
              ])
              .execute();

            myWidget.selectedItemId = null;
          }
        });
      },

      onLoad: function () {
        console.log("📌 Widget onLoad triggered");

        var contentDiv = document.getElementById("content-display");

        contentDiv.innerHTML = `
                    <div style="width:100vw;height:100vh;display:flex;flex-direction:column;">
 <h1 style="margin:0;height:100vh;display:flex;justify-content:center;align-items:center;font-size:clamp(2rem,8vw,6rem);text-align:center;">Send any data to Vertex</h1> 
                         
 <div style="flex:1;">
 <h2 id="cornerBox" style="position:fixed;top:10px;right:10px;font-size:18px;">
</h2>
                            <vertex-viewer id="vertexViewer"
                                style="width:100%;height:100%;">
                            </vertex-viewer>
                        </div>
                    </div>
                `;
      },
    };

    widget.addEvent("onLoad", myWidget.onLoad);
  });
}
