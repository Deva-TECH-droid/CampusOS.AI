import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Heart, ArrowLeft, Link2, Globe } from "lucide-react";
import { getStory, toggleLike } from "../../api/alumni.api";

const StoryDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState(null);

  useEffect(() => {
    getStory(id)
      .then(({ data }) => setStory(data?.data?.story || null))
      .finally(() => setLoading(false));
  }, [id]);

  const like = async () => {
    setStory((prev) => ({
      ...prev,
      liked: !prev.liked,
      likeCount: prev.likeCount + (prev.liked ? -1 : 1),
    }));
    try {
      await toggleLike(id);
    } catch {
      // best-effort
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="animate-spin text-gray-300" size={22} />
      </div>
    );
  }

  if (!story) {
    return <p className="text-center text-sm text-gray-500 py-24">Story not found.</p>;
  }

  const alumnus = story.alumnus;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/alumni" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
        <ArrowLeft size={13} /> Back to all stories
      </Link>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">{story.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {alumnus?.firstName} {alumnus?.lastName} · {story.role} at{" "}
          <span className="font-medium text-gray-700">{story.company}</span>
          {story.graduationYear ? ` · Class of ${story.graduationYear}` : ""}
        </p>

        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{story.content}</p>

        {story.adviceForJuniors && (
          <div className="mt-5 bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-900 mb-1.5">Advice for juniors</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{story.adviceForJuniors}</p>
          </div>
        )}

        {(story.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {story.tags.map((tag) => (
              <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-3">
            {alumnus?.linkedin && (
              <a href={alumnus.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900">
                <Link2 size={16} />
              </a>
            )}
            {alumnus?.github && (
              <a href={alumnus.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900">
                <Link2 size={16} />
              </a>
            )}
            {alumnus?.portfolio && (
              <a href={alumnus.portfolio} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900">
                <Globe size={16} />
              </a>
            )}
          </div>
          <button
            onClick={like}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              story.liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart size={16} fill={story.liked ? "currentColor" : "none"} />
            {story.likeCount || 0}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;
