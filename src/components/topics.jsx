const RenderTopics = ({ sem, subject }) => {
  const topics = {
    "sem-1": {
      wd: [
        {
          slides: [
            { filename: "whatever1", linkText: "wwwaa1" },
            { filename: "whatever2", linkText: "wwwaa2" }
          ],
          notes: [
            { filename: "pdf-1", linkText: "whatever1" },
            { filename: "pdf-2", linkText: "whatever2" }
          ],
        },
      ],
    },
    "sem-2": {
      a: [
        {
          slides: [
            { filename: "whatever-sem2", linkText: "wwwaa-sem2" }
          ],
          notes: [
            { filename: "pdf-sem2", linkText: "whatever-sem2" }
          ],
        },
      ],
    },
  };

  // Get the correct data for the given semester and subject
  const semesterData = topics[sem];
  if (!semesterData) return <p>No data for this semester.</p>;

  const subjectData = semesterData[subject];
  if (!subjectData) return <p>No data for this subject.</p>;

  return (
    <>
      {subjectData.map((topic, index) => (
        <div key={index}>
          {topic.slides && (
            <div>
              <h3>Slides:</h3>
              {topic.slides.map((slide, i) => (
                <p key={i}>
                  {slide.linkText}: <a href={slide.filename}>{slide.filename}</a>
                </p>
              ))}
            </div>
          )}

          {topic.notes && (
            <div>
              <h3>Notes:</h3>
              {topic.notes.map((note, i) => (
                <p key={i}>
                  {note.linkText}: <a href={note.filename}>{note.filename}</a>
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default RenderTopics;
