import axios from "axios";

export const isUsernameUnsuitable = async (username) => {
  try {
    const res = await axios.get(`https://api.api-ninjas.com/v1/profanityfilter?text=${username}`, {
      headers: { 'X-Api-Key': import.meta.env.VITE_PROF_API_KEY }
    });
    return res.data.has_profanity; 
  } catch (error) {
    console.error("Username check failed:", error);
    return false; 
  }
};
