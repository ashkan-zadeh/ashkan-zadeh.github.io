import React from "react";
import newsData from "../../data/news.json";

const img = (path) => `/asset/img/${path}`;

const supervisors = [
  [
    "Dr Xiaomeng Li",
    "Principal Supervisor",
    "Human Behaviour, Experimental Design, Data Analysis.",
    "supervisor-xiaomeng-li.jpg",
  ],
  [
    "Prof Andry Rakotonirainy",
    "Supervisor",
    "Intelligent Transport Systems, AI, Human Factors.",
    "supervisor-andry-rakotonirainy.jpg",
  ],
  [
    "Prof Ronald Schroeter",
    "Supervisor",
    "Human-Machine Interaction, Road Safety, Automated Vehicle Design.",
    "supervisor-ronald-schroeter.jpg",
  ],
  [
    "Prof Sebastien Glaser",
    "Supervisor",
    "Intelligent Transport Systems, Automated Vehicle Design, Safety Deployment.",
    "supervisor-sebastien-glaser.png",
  ],
];

const publications = [
  [
    "2026",
    "ECCV DriveX Workshop",
    "NARRATE: A Multimodal Real-World Australian Driving Dataset for Human-Centred Explanations in Automated Driving",
    "Ashkan Yousefi Zadeh, Zishuo Zhu, Xiaomeng Li, Andry Rakotonirainy, Sebastien Glaser, Ronald Schroeter, Patricia Delhomme, and Zahra Mehraban.",
    "narrate/narrate_sample.png",
    "https://arxiv.org/abs/2608.14767",
  ],
  [
    "2026",
    "Advanced Engineering Informatics, under review",
    "X-Blocks: A Linguistic Knowledge Acquisition Framework for Scenario-Aware Explanations in Automated Vehicles",
    "Ashkan Yousefi Zadeh, Xiaomeng Li, Andry Rakotonirainy, Ronald Schroeter, Sebastien Glaser, and Zishuo Zhu.",
    "xblocks-thumbnail.png",
    "https://arxiv.org/abs/2602.13248",
  ],
  [
    "2026",
    "AHFE IHIET",
    "Explainability in Automated Driving: From Spatial Attention to Human-Centred Reasoning",
    "Andry Rakotonirainy, Ashkan Yousefi Zadeh, Zishuo Zhu, Djamel Benrachou, Mohammed Elhenawy, Sebastien Glaser, Xiaomeng Li, Ronald Schroeter, Melaine Gouillou, and Patricia Delhomme.",
    "xai-av-hero.png",
    "https://doi.org/10.54941/ahfe1008076",
  ],
  [
    "2025",
    "XAI Conference",
    "PsyLingXAV: A Psycholinguistics Design Framework for XAI in Automated Vehicles",
    "Ashkan Yousefi Zadeh, Xiaomeng Li, Andry Rakotonirainy, Ronald Schroeter, and Sebastien Glaser.",
    "psylingxav-thumbnail.png",
    "https://ceur-ws.org/Vol-4017/paper_14.pdf",
  ],
  [
    "2024",
    "IEEE T-ITS",
    "Integrated Intelligent Control Systems for Eco and Safe Driving in Autonomous Vehicles",
    "A. Yousefi Zadeh, A. Jamali, R. Mallipeddi, and H. Khayyam.",
    "ieee-tits-thumbnail.png",
    "https://doi.org/10.1109/TITS.2024.3479332",
  ],
  [
    "2024",
    "EAAI",
    "Fuzzy Adaptive Cruise Control with Model Predictive Control for Automated Driving",
    "Z. Mehraban, A. Yousefi Zadeh, A. Jamali, R. Mallipeddi, and H. Khayyam.",
    "fuzzy-acc-thumbnail.png",
    "https://www.sciencedirect.com/science/article/pii/S0952197624011667",
  ],
];

const news = newsData.items.slice(0, 10);

const timeline = [
  [
    "Jan 2025 - Present",
    "Automotive CE Applications Technical Committee Member",
    "IEEE Consumer Technology Society.",
  ],
  [
    "Sep 2024 - Present",
    "AdHoc Committee on Autonomous Vehicles",
    "IEEE Vehicular Technology Society.",
  ],
  [
    "Feb 2024 - Present",
    "Tutor",
    "Teaching Computing and Data for Engineers at Queensland University of Technology.",
  ],
  [
    "Jun 2023 - Present",
    "Doctoral Researcher",
    "AVR3, formerly CARRS-Q, Queensland University of Technology.",
  ],
  [
    "Apr 2022 - Present",
    "Peer Reviewer",
    "Reviewing for IEEE Transactions on Intelligent Transportation Systems and IEEE Access.",
  ],
  [
    "Nov 2022 - Mar 2023",
    "Python Developer",
    "Server-side AI project development, deployment, and debugging at HeyvaAI.",
  ],
];

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

const Section = ({ id, kicker, title, children }) => (
  <section className="border-t border-line pt-10 mb-12" id={id}>
    <h5 className="font-header font-semibold text-front text-sm uppercase mb-3">
      {kicker}
    </h5>
    <h2 className="font-header font-light text-3xl text-front leading-tight mb-5">
      {title}
    </h2>
    {children}
  </section>
);

const Figure = ({ src, alt, caption }) => (
  <figure className="bg-back-light border-t-4 border-line p-4 mb-4">
    <img className="w-full object-cover mb-3" src={src} alt={alt} />
    <figcaption className="font-text text-sm opacity-80">{caption}</figcaption>
  </figure>
);

const OriginalSections = () => (
  <>
    <Section
      id="publications"
      kicker="Publications"
      title="Selected publications."
    >
      <div className="space-y-5">
        {publications.map(([year, venue, title, authors, photo, url]) => (
          <article
            className="bg-back-light border-t-4 border-line p-4 md:flex gap-4"
            key={title}
          >
            <img
              className="w-full md:w-40 aspect-video object-cover mb-3 md:mb-0"
              src={img(photo)}
              alt={title}
            />
            <div>
              <p className="font-header text-xs uppercase opacity-60">
                {year} / {venue}
              </p>
              <h3 className="font-header font-bold text-front">{title}</h3>
              <p className="font-text text-sm mt-2">{authors}</p>
              <a
                className="font-text text-sm underline mt-2 inline-block"
                href={url}
                target="_blank"
                rel="noreferrer noopener"
              >
                Read more
              </a>
            </div>
          </article>
        ))}
      </div>
    </Section>

    <Section
      id="bio"
      kicker="Bio"
      title="Research at the intersection of AI, language, and automated mobility."
    >
      <div className="font-text text-sm leading-normal space-y-4">
        <p>
          My thesis develops a model for generating human-centric explanations
          for automated vehicles. I connect Human-Centred Artificial
          Intelligence, Explainable AI, Natural Language Processing, and
          autonomous driving to improve transparency and trust in
          safety-critical systems.
        </p>
        <p>
          My current applied AI work includes multimodal driving datasets, VLM
          generation and evaluation, NLP analysis of human explanations, and
          human-subject studies for trust and explainability evaluation.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Figure
          src={img("ashkan_tina.jpg")}
          alt="Ashkan and Tina Mehraban at PhD Confirmation Seminar"
          caption="With Zahra (Tina) Mehraban at my PhD Confirmation Seminar."
        />
        <Figure
          src={img("concept-human-centred-ai.jpg")}
          alt="Human-centred AI concept"
          caption="Human-centred explanation design for safety-critical autonomous systems."
        />
      </div>
    </Section>

    <Section
      id="supervision"
      kicker="Supervision"
      title="Guided by experts in AI, road safety, HMI, and automated mobility."
    >
      <div className="grid md:grid-cols-2 gap-4">
        {supervisors.map(([name, role, text, photo]) => (
          <article
            className="bg-back-light border-t-4 border-line p-4"
            key={name}
          >
            <img
              className="w-20 h-20 rounded-full object-cover mb-3"
              src={img(photo)}
              alt={name}
            />
            <p className="font-header text-xs uppercase opacity-60">{role}</p>
            <h3 className="font-header font-bold text-front">{name}</h3>
            <p className="font-text text-sm mt-2">{text}</p>
          </article>
        ))}
      </div>
    </Section>

    <Section
      id="research-life"
      kicker="Research Life"
      title="Field work, community, and the platform behind the data."
    >
      <article className="bg-back-light border-t-4 border-line p-4 mb-4">
        <div className="grid md:grid-cols-5 gap-4 items-start">
          <img
            className="w-full md:col-span-3 h-56 md:h-72 object-cover"
            src={img("narrate/eccv_1.jpg")}
            alt="Ashkan Yousefi Zadeh and Tina Mehraban presenting the NARRATE poster at ECCV 2026 DriveX"
            style={{ objectPosition: "center 45%" }}
          />
          <div className="md:col-span-2">
            <p className="font-header text-xs uppercase opacity-60">
              ECCV 2026 / DriveX Workshop
            </p>
            <h3 className="font-header font-bold text-front mt-1">
              NARRATE in Malmo.
            </h3>
            <p className="font-text text-sm mt-2">
              Presented our NARRATE work with Tina Mehraban and discussed
              human-centred explanations for automated driving with the computer
              vision and automated mobility research community.
            </p>
            <a
              className="font-text text-sm underline mt-3 inline-block"
              href="/projects/narrate/"
            >
              Open project
            </a>
          </div>
        </div>
      </article>
      <Figure
        src={img("Kia.jpeg")}
        alt="Instrumented Kia automated vehicle"
        caption="The instrumented Kia EV6 used for naturalistic driving data collection in my PhD study."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Figure
          src={img("AVR3_1.jpeg")}
          alt="AVR3 research team"
          caption="The AVR3 research team advancing automated vehicles in rural and remote Australia."
        />
        <Figure
          src={img("AVR3_2.jpeg")}
          alt="AVR3 research demonstration"
          caption="Research demonstration at RACQ Mobility Centre, Mount Cotton."
        />
      </div>
    </Section>

    <Section
      id="research"
      kicker="Research Interests"
      title="From perception data to explanations people can use."
    >
      <div className="grid md:grid-cols-3 gap-4">
        {[
          [
            "Automated Vehicles and Computer Vision",
            "Perception, scene understanding, sensor evidence, and driving context.",
            "concept-computer-vision-av.jpg",
          ],
          [
            "LLMs and Natural Language Processing",
            "Language generation, linguistic building blocks, and structured explanation content.",
            "concept-llm-nlp.jpg",
          ],
          [
            "Human-Centred AI and Trust",
            "Explanation design grounded in user needs, transparency, interpretability, and trust calibration.",
            "concept-human-centred-ai.jpg",
          ],
        ].map(([title, text, photo]) => (
          <article
            className="bg-back-light border-t-4 border-line p-4"
            key={title}
          >
            <img
              className="w-full aspect-video object-cover mb-3"
              src={img(photo)}
              alt={title}
            />
            <h3 className="font-header font-bold text-front">{title}</h3>
            <p className="font-text text-sm mt-2">{text}</p>
          </article>
        ))}
      </div>
    </Section>

    <Section
      id="news"
      kicker="News"
      title="Automated mobility and AI intelligence brief."
    >
      <div className="space-y-4">
        {news.map((item) => (
          <article
            className="bg-back-light border-l-4 border-lead p-4"
            key={item.url}
          >
            <p className="font-header text-xs uppercase opacity-60">
              {item.source} / {item.category} / {formatDate(item.published)}
            </p>
            <h3 className="font-header font-bold text-front">
              <a href={item.url} target="_blank" rel="noreferrer noopener">
                {item.title}
              </a>
            </h3>
            <p className="font-text text-sm mt-2">{item.summary}</p>
          </article>
        ))}
      </div>
      <a
        className="font-text text-sm underline mt-4 inline-block"
        href="/news-archive/"
      >
        View news archive
      </a>
    </Section>

    <Section id="experience" kicker="Experience" title="Roles and jobs.">
      <div className="space-y-4">
        {timeline.map(([period, title, text]) => (
          <article
            className="grid md:grid-cols-4 gap-3 border-t border-line pt-4"
            key={`${period}-${title}`}
          >
            <time className="font-header text-sm uppercase text-lead">
              {period}
            </time>
            <div className="md:col-span-3">
              <h3 className="font-header font-bold text-front">{title}</h3>
              <p className="font-text text-sm mt-1">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>

    <Section
      id="education"
      kicker="Education and Awards"
      title="Academic foundation."
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-back-light p-4 border-t-4 border-line">
          <h3 className="font-header font-bold text-front mb-3">Education</h3>
          <ul className="font-text text-sm space-y-2">
            <li>
              <strong>PhD in Computer Science</strong>
              <br />
              Queensland University of Technology, 2023 - Present
            </li>
            <li>
              <strong>MSc in Mechanical Engineering</strong>
              <br />
              University of Guilan, 2019 - 2022
            </li>
            <li>
              <strong>BSc in Mechanical Engineering</strong>
              <br />
              Islamic Azad University, 2013 - 2018
            </li>
          </ul>
        </div>
        <div className="bg-back-light p-4 border-t-4 border-line">
          <h3 className="font-header font-bold text-front mb-3">
            Awards and Recognition
          </h3>
          <ul className="font-text text-sm space-y-2">
            <li>IEEE Human-Centric AI Summer School Scholarship, 2024.</li>
            <li>
              ARC Postgraduate Research Stipend and QUT Postgraduate Research
              Award.
            </li>
            <li>QUT Runner-Up, Visualise Your Thesis Competition, 2023.</li>
          </ul>
        </div>
      </div>
    </Section>

    <Section id="memorial" kicker="In Loving Memory" title="Prof. Ali Jamali">
      <div className="bg-back-light border-t-4 border-line p-4 md:flex gap-5">
        <img
          className="w-36 h-36 object-cover rounded-full mb-4 md:mb-0"
          src={img("Dr_Jamali.jpeg")}
          alt="Professor Ali Jamali"
        />
        <div className="font-text text-sm leading-normal space-y-3">
          <p>
            Prof. Ali Jamali was one of the rare people who genuinely changed
            the direction of my life. He guided me, believed in me, and opened
            doors I never imagined I could walk through.
          </p>
          <p>
            His lessons, kindness, and legacy stay with me. Everything I achieve
            from this point on carries a part of his influence.
          </p>
        </div>
      </div>
    </Section>

    <Section
      id="contact"
      kicker="Contact"
      title="Let us talk about explainable autonomy."
    >
      <div className="bg-back-light border-t-4 border-line p-5">
        <a
          className="font-header text-2xl text-front underline break-all"
          href="mailto:ashkan.zadeh@qut.edu.au"
        >
          ashkan.zadeh@qut.edu.au
        </a>
        <div className="flex flex-wrap gap-3 mt-5 font-text text-sm">
          <a
            className="underline"
            href="/asset/img/Ashkan_CV_Sept_2026_Job.pdf"
          >
            Download CV
          </a>
          <a
            className="underline"
            href="https://scholar.google.com/citations?user=6e-KEPoAAAAJ&hl=en&oi=ao"
            target="_blank"
            rel="noreferrer noopener"
          >
            Google Scholar
          </a>
          <a
            className="underline"
            href="https://linkedin.com/in/ashkan-ysf/"
            target="_blank"
            rel="noreferrer noopener"
          >
            LinkedIn
          </a>
          <a
            className="underline"
            href="https://github.com/ashkan-zadeh"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
        </div>
      </div>
    </Section>
  </>
);

export default OriginalSections;
