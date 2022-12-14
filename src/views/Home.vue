<template>
  <v-container align="center" justify="center">
    <div class="timeline-container">
      <div class="new-post-container">
        <textarea
          v-if="getUser()?.followers"
          v-model="description"
          class="message-input"
          :placeholder="placeholderText"
        ></textarea>

        <div class="buttons">
          <input type="file" id="fileInput" ref="inputFile" @change="updateFile" />
          <v-btn tag="label" for="fileInput" style="color: white">
            <v-icon>mdi-paperclip</v-icon>&nbsp;{{ file ? file.name : 'Attach' }}
          </v-btn>

          <v-btn @click="createPost" :disabled="uploading" style="color: white; background-color: #102818">
            <Satellite />&nbsp;Broadcast </v-btn
          ><v-btn @click="bulkCreatePost(30)" :disabled="uploading" style="color: white; background-color: #102818">
            <Satellite />&nbsp;BULK Broadcast
          </v-btn>
        </div>
      </div>
      <div class="posts-container" v-if="posts.length > 0">
        <TimelinePost v-for="post in posts" :key="post.id" :data="post" />
      </div>
      <div class="posts-container" style="text-align: center" v-else>
        <br />
        <h4 style="color:  #205030; font-weight: 400">
          Votre timeline semble très vide :(<br />
          Vous devriez <strong>explore</strong> un peu plus pour trouver plus de contenu!
        </h4>
        <v-btn tag="router-link" to="/explore" class="mt-2" style="color: white; background-color: #205030">
          <Observatory />&nbsp;Explore
        </v-btn>
      </div>
      <div
        v-show="fetching"
        style="
          color: white;
          text-align: center;
          height: 100px;
          justify-content: center;
          align-items: center;
          display: flex;
        "
      >
        LOADING
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import Satellite from '@/components/CustomIcon/Satellite.vue';
import { defineComponent } from 'vue';
import axios from '@/plugins/axios';
import { mapActions, mapGetters } from 'vuex';
import Observatory from '@/components/CustomIcon/Observatory.vue';
import TimelinePost from '@/components/Posts/TimelinePost.vue';

export default defineComponent({
  name: 'Home',

  components: {
    Satellite,
    TimelinePost,
    Observatory,
  },

  data() {
    return {
      file: null,
      description: '',
      before: '',
      after: '',
      posts: [],
      uploading: false,
      fetching: false,
    };
  },

  async mounted() {
    if ((this as any).isLoggedIn()) {
      (this as any).retrieveUser();
      const data = await (this as any).getPosts('');

      if (data?.items?.length) {
        (this as any).posts = data.items;
        (this as any).before = data.previous;
        (this as any).after = data.next;
      }
    } else {
      (this as any).$router.push('/');
    }

    (this as any).scrollDetector();
  },

  computed: {
    placeholderText() {
      const followerCount = (this as any).getUser().followers;
      return `Partagez vos pensées ${
        followerCount > 0
          ? 'avec vos ' + followerCount + ' followers' + (followerCount == 1 ? '' : 's') + '!'
          : 'space!'
      }`;
    },
  },

  methods: {
    ...mapGetters(['isLoggedIn', 'getUser']),
    ...mapActions(['retrieveUser']),

    updateFile(e: any) {
      if (e?.target?.files?.[0]) {
        (this as any).file = e.target.files[0];
      } else {
        (this as any).file = null;
        (window as any).document.getElementById('fileInput').value = null;
      }
    },

    scrollDetector() {
      window.onscroll = async () => {
        let bottomOfWindow =
          Math.ceil(
            Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) +
              window.innerHeight,
          ) >= document.documentElement.offsetHeight;
        if (bottomOfWindow && !(this as any).fetching) {
          (this as any).fetching = true;
          try {
            const data = await (this as any).getPosts((this as any)?.after);

            if (data?.items?.length) {
              // merge (this as any).posts with data.items
              const existingPostsIds = (this as any).posts.map((post: any) => post.id);

              data.items = data.items.filter((newPost: any) => {
                return !existingPostsIds.includes(newPost.id);
              });

              (this as any).posts = [...(this as any).posts, ...data.items];
              (this as any).before = data.previous;
              (this as any).after = data.next;
            }

            (this as any).fetching = false;
          } catch (e) {
            (this as any).fetching = false;
            console.error(e);
          }
        }
      };
    },

    async getPosts(after: string) {
      const res = await axios.get(`/timeline${after ? '?after=' + after : ''}`);

      if ((res as any)?.data?.items) {
        return (res as any)?.data;
      }
    },

    async bulkCreatePost(count: number) {
      (this as any).description = `Post`;
      const file = (this as any).file;

      if ((this as any).file && (this as any)?.description.length > 0) {
        for (let i = 0; i < count; i++) {
          (this as any).description = `Post ${i}`;
          (this as any).file = file;
          await (this as any).createPost();
        }
      }
    },

    async createPost() {
      if ((this as any).file && (this as any)?.description.length > 0) {
        (this as any).uploading = true;
        try {
          const post = await axios.post('/posts', {
            fileName: (this as any).file.name,
            fileType: (this as any).file.type,
            description: (this as any).description,
          });

          if ((post as any)?.data?.uploadURL) {
            await fetch((post as any)?.data?.uploadURL, {
              method: 'PUT', 
              headers: {
                'Content-Type': (this as any).file.type,               
              },
              body: (this as any).file,
            });

            const publishedPost = await axios.post(`/posts/${(post as any)?.data?.id}/publish`);

            (this as any).description = '';
            (this as any).updateFile(null);

            const data = await (this as any).getPosts('');

            if (data?.items?.length) {
              (this as any).posts = data.items;
              (this as any).before = data.previous;
              (this as any).after = data.next;
            }

            (this as any).uploading = false;
            return publishedPost;
          }
        } catch (e) {
          (this as any).uploading = false;
          console.error(e);
          return e;
        }
      } else {
        return null;
      }
    },
  },
});
</script>

<style scoped>
input[type='file'] {
  display: none;
}

.timeline-container {
  min-height: 100vh;
  text-align: left;
  padding: 0px 14px 0px 14px;
  max-width: 600px;
}

.new-post-container {
  width: 100%;
  min-height: 180px;
  border-radius: 12px;
  background-color: #205030;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.new-post-container .message-input {
  width: 100%;
  height: 130px;
  min-height: 130px;
  resize: none;
  color: white;

  border: none;
  overflow: auto;
  outline: none;

  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  box-shadow: none;
}

.new-post-container .buttons {
  margin-top: 12px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.new-post-container .buttons .v-btn {
  color: white;
  background-color: #102818;
}

/* media query max width 424px */
@media (max-width: 424px) {
  .new-post-container .buttons {
    flex-direction: column;
    align-items: flex-start;
  }

  .new-post-container .buttons .v-btn {
    margin-top: 12px;
  }
}
</style>
