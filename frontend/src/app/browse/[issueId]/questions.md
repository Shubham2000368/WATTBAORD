### Clarifications for Issue Tracking Overhaul

Before I begin implementing the advanced features, I have a few clarifying questions:

1.  **Attachment Storage**: Is local storage (`backend/uploads` folder) sufficient for file attachments at this stage, or would you prefer integration with a cloud provider like **Cloudinary** or **AWS S3**?
2.  **Real-time Updates**: For the "real-time" requirement on comments, should I implement **WebSockets (Socket.io)** now, or would a robust "polling/refresh" mechanism be enough for this phase?
3.  **Multi-Assignee Selection**: Do you have a preference for the user selection UI? I plan to implement a searchable multi-select dropdown with "pills" for selected users—does that work for you?
4.  **Time Tracking Display**: Should the "Time in Status" be visible on the Kanban board tickets as well, or just on the issue detail page?

Please let me know your thoughts on these!
